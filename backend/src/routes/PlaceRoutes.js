import express from 'express';
import Place from '../models/Place.js';
import User from '../models/User.js';
import { buildRouteLines } from '../services/places/googleDirections.js';
import { fetchNearbyPlacesGoogle } from '../services/places/googlePlaces.js';
import { calculateCentroid, rankMeetingPlaces } from '../services/places/meetingPlanner.js';

const router = express.Router();

function buildMongoQuery({ lat, lng, radius, category }) {
  const query = {
    source: 'google',
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  return query;
}

function mapPlaceToDocument(place) {
  return {
    externalId: place.externalId || place._id,
    source: place.source || 'google',
    name: place.name,
    category: place.category,
    rating: place.rating ?? null,
    ratingSource: place.ratingSource || null,
    userRatingsTotal: place.userRatingsTotal ?? null,
    googlePlaceId: place.googlePlaceId ?? null,
    vicinity: place.vicinity,
    openingHours: place.openingHours,
    phone: place.phone,
    website: place.website,
    cuisine: place.cuisine,
    wheelchair: place.wheelchair,
    priceLevel: place.priceLevel,
    openNow: place.openNow,
    businessStatus: place.businessStatus,
    location: {
      type: 'Point',
      coordinates: place.location?.coordinates || [],
    },
    cachedAt: new Date(),
    lastSeenAt: new Date(),
  };
}

async function upsertPlaces(places) {
  if (!places.length) return;

  await Place.bulkWrite(
    places.map((place) => ({
      updateOne: {
        filter: { externalId: place.externalId || place._id },
        update: { $set: mapPlaceToDocument(place) },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

function normalizeCachedPlace(place) {
  const plain = typeof place.toObject === 'function' ? place.toObject() : place;
  return {
    ...plain,
    _id: plain.externalId || String(plain._id),
    location: {
      coordinates: plain.location?.coordinates || [],
    },
  };
}

function buildTemporaryPlan(userCoords, travelMode) {
  return {
    members: userCoords.map((coords, index) => ({
      userId: `person-${index + 1}`,
      name: index === 0 ? 'You' : `Person ${index + 1}`,
      travelMode,
      location: {
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
      },
    })),
    votes: [],
  };
}

function serializeRankedPlace(place) {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  return {
    ...place,
    _id: place.placeId,
    location: {
      coordinates: [longitude, latitude],
      latitude,
      longitude,
    },
  };
}

function serializeEffectiveMidpoint(midpoint) {
  if (!midpoint) return null;
  return {
    ...midpoint,
    name: midpoint.placeName,
    latitude: midpoint.latitude,
    longitude: midpoint.longitude,
  };
}

// GET /places/nearby?lat=17.38&lng=78.48&radius=5&category=cafe
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;
    const debug = {
      route: 'GET /places/nearby',
      query: { lat, lng, radius, category: category || 'all' },
      provider: 'google',
      googleApiKeyPresent: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      serverTime: new Date().toISOString(),
    };
    const mongoQuery = buildMongoQuery({ lat, lng, radius, category });

    let places = await fetchNearbyPlacesGoogle({
      lat,
      lng,
      radiusKm: radius,
      category: category || 'all',
      debug,
    });

    if (places.length) {
      await upsertPlaces(places);
      debug.final = {
        source: 'google',
        returnedCount: places.length,
        ratedCount: places.filter((place) => Number.isFinite(place.rating)).length,
        googleRatedCount: places.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length,
      };
      return res.json({ places, source: 'google', debug });
    }

    const cachedPlaces = await Place.find(mongoQuery).sort({ lastSeenAt: -1 }).limit(50);
    debug.final = {
      source: 'mongo-fallback-after-google-empty',
      returnedCount: cachedPlaces.length,
      ratedCount: cachedPlaces.filter((place) => Number.isFinite(place.rating)).length,
      googleRatedCount: cachedPlaces.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length,
    };
    return res.json({ places: cachedPlaces, source: 'mongo-fallback-after-google-empty', debug });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: 'Server error',
      debug: {
        route: 'GET /places/nearby',
        error: err.message,
        serverTime: new Date().toISOString(),
      },
    });
  }
});

// POST /places/ranked
// Body: { userCoords: [{ latitude, longitude }], radius, category, travelMode }
router.post('/ranked', async (req, res) => {
  try {
    const {
      userCoords = [],
      midpoint,
      radius = 5,
      category = 'all',
      travelMode = 'driving',
      filters = {},
    } = req.body || {};

    const validCoords = Array.isArray(userCoords)
      ? userCoords.filter((coords) =>
        Number.isFinite(Number(coords?.latitude)) && Number.isFinite(Number(coords?.longitude))
      )
      : [];

    const debug = {
      route: 'POST /places/ranked',
      body: {
        userCoordCount: validCoords.length,
        midpointProvided: Boolean(midpoint),
        radius,
        category,
        travelMode,
      },
      provider: 'google',
      googleApiKeyPresent: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      serverTime: new Date().toISOString(),
    };

    if (validCoords.length < 2) {
      return res.status(400).json({
        msg: 'At least two valid user coordinates are required',
        debug,
      });
    }

    const plan = buildTemporaryPlan(validCoords, travelMode);
    const center = midpoint
      && Number.isFinite(Number(midpoint.latitude))
      && Number.isFinite(Number(midpoint.longitude))
      ? {
        latitude: Number(midpoint.latitude),
        longitude: Number(midpoint.longitude),
      }
      : calculateCentroid(plan.members);

    let places = await fetchNearbyPlacesGoogle({
      lat: center.latitude,
      lng: center.longitude,
      radiusKm: radius,
      category,
      debug,
    });
    let source = 'google';

    if (places.length) {
      await upsertPlaces(places);
    } else {
      const cachedPlaces = await Place.find(buildMongoQuery({
        lat: center.latitude,
        lng: center.longitude,
        radius,
        category,
      }))
        .sort({ lastSeenAt: -1 })
        .limit(50);
      places = cachedPlaces.map(normalizeCachedPlace);
      source = places.length ? 'mongo-fallback-after-google-empty' : 'empty-after-google-empty';
      debug.mongoFallback = {
        returnedCount: places.length,
        ratedCount: places.filter((place) => Number.isFinite(place.rating)).length,
        googleRatedCount: places.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length,
      };
    }

    const rankedResult = await rankMeetingPlaces({
      plan,
      places,
      travelMode,
      filters: {
        minRating: filters.minRating ? Number(filters.minRating) : undefined,
        priceLevel: filters.priceLevel || 'any',
        openNow: filters.openNow === true,
      },
      debug,
    });

    const ranked = rankedResult.recommendations.map(serializeRankedPlace);
    const routeLines = await buildRouteLines({
      members: plan.members,
      destination: rankedResult.effectiveMidpoint,
      mode: travelMode,
      debug,
    });

    return res.json({
      center,
      source,
      places,
      ranked,
      paretoFront: rankedResult.paretoFront.map(serializeRankedPlace),
      effectiveMidpoint: serializeEffectiveMidpoint(rankedResult.effectiveMidpoint),
      geometricCentroid: rankedResult.geometricCentroid,
      usingRealRouting: rankedResult.usingRealRouting,
      routeLines,
      debug: {
        ...debug,
        final: {
          rankedCount: ranked.length,
          placeCount: places.length,
          ratedCount: places.filter((place) => Number.isFinite(place.rating)).length,
          googleRatedCount: places.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length,
        },
      },
    });
  } catch (err) {
    console.error('Ranked places error:', err);
    res.status(500).json({
      msg: 'Server error',
      debug: {
        route: 'POST /places/ranked',
        error: err.message,
        serverTime: new Date().toISOString(),
      },
    });
  }
});

router.get('/saved', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'userId required' });

    const user = await User.findById(userId).select('savedPlaces');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({ places: user.savedPlaces || [] });
  } catch (err) {
    console.error('Saved places error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/saved', async (req, res) => {
  try {
    const { userId, place, status = 'saved' } = req.body;
    if (!userId || !place?.placeId) {
      return res.status(400).json({ msg: 'userId and place are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.savedPlaces = user.savedPlaces.filter((item) => item.placeId !== place.placeId);
    user.savedPlaces.unshift({
      ...place,
      status,
      savedAt: new Date(),
    });

    await user.save();
    res.json({ msg: 'Place saved', places: user.savedPlaces });
  } catch (err) {
    console.error('Save place error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.patch('/saved/:placeId', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) return res.status(400).json({ msg: 'userId and status required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const place = user.savedPlaces.find((item) => item.placeId === req.params.placeId);
    if (!place) return res.status(404).json({ msg: 'Saved place not found' });

    place.status = status;
    await user.save();

    res.json({ msg: 'Saved place updated', places: user.savedPlaces });
  } catch (err) {
    console.error('Update saved place error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/saved/:placeId', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'userId required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const beforeCount = user.savedPlaces.length;
    user.savedPlaces = user.savedPlaces.filter((item) => item.placeId !== req.params.placeId);

    if (user.savedPlaces.length === beforeCount) {
      return res.status(404).json({ msg: 'Saved place not found' });
    }

    await user.save();
    res.json({ msg: 'Saved place deleted', places: user.savedPlaces });
  } catch (err) {
    console.error('Delete saved place error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
