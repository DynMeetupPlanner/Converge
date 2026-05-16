import express from 'express';
import Place from '../models/Place.js';
import User from '../models/User.js';
import { fetchNearbyPlacesOverpass } from '../services/places/overpass.js';
import { enrichPlacesWithGoogleIfNeeded } from '../services/places/googlePlaces.js';

const router = express.Router();
const MIN_CACHE_RESULTS = 12;
const CACHE_STALE_MS = 1000 * 60 * 60 * 24 * 14;

function buildMongoQuery({ lat, lng, radius, category }) {
  const query = {
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

function mapOverpassPlaceToDocument(place) {
  return {
    externalId: place.externalId || place._id,
    source: 'overpass',
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
        update: { $set: mapOverpassPlaceToDocument(place) },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

// GET /places/nearby?lat=17.38&lng=78.48&radius=5&category=cafe
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;
    const mongoQuery = buildMongoQuery({ lat, lng, radius, category });
    const cachedPlaces = await Place.find(mongoQuery).sort({ lastSeenAt: -1 }).limit(50);
    const newestCache = cachedPlaces[0]?.cachedAt ? new Date(cachedPlaces[0].cachedAt).getTime() : 0;
    const cacheFresh = newestCache && (Date.now() - newestCache) < CACHE_STALE_MS;

    if (cachedPlaces.length >= MIN_CACHE_RESULTS && cacheFresh) {
      let places = cachedPlaces.map((place) => place.toObject());
      const hasGoogleRatings = places.some((place) => place.ratingSource === 'google' && Number.isFinite(place.rating));
      if (!hasGoogleRatings && process.env.GOOGLE_PLACES_API_KEY) {
        places = await enrichPlacesWithGoogleIfNeeded({
          places,
          lat,
          lng,
          radiusKm: radius,
        });
        await upsertPlaces(places);
      }
      return res.json({ places, source: 'mongo-cache' });
    }

    const provider = String(process.env.PLACES_PROVIDER || 'overpass').toLowerCase();
    if (provider === 'overpass') {
      try {
        let places = await fetchNearbyPlacesOverpass({
          lat,
          lng,
          radiusKm: radius,
          category: category || 'all',
        });

        places = await enrichPlacesWithGoogleIfNeeded({
          places,
          lat,
          lng,
          radiusKm: radius,
        });

        await upsertPlaces(places);
        const refreshedPlaces = await Place.find(mongoQuery).sort({ lastSeenAt: -1 }).limit(50);
        return res.json({
          places: refreshedPlaces.length ? refreshedPlaces : places,
          source: refreshedPlaces.length ? 'mongo-after-overpass' : 'overpass',
        });
      } catch (err) {
        console.error('Overpass nearby search failed, falling back to Mongo:', err);
      }
    }

    return res.json({ places: cachedPlaces, source: 'mongo-fallback' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
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
