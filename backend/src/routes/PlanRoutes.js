import express from 'express';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import Place from '../models/Place.js';
import { fetchNearbyPlacesGoogle } from '../services/places/googlePlaces.js';
import {
  calculateCentroid,
  getCommonAvailability,
  getEmergencyAlternatives,
  rankMeetingPlaces,
} from '../services/places/meetingPlanner.js';

const router = express.Router();

function buildPlacesNearQuery({ center, radius, category }) {
  const query = {
    source: 'google',
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [center.longitude, center.latitude],
        },
        $maxDistance: Number(radius) * 1000,
      },
    },
  };

  if (category && category !== 'all') query.category = category;
  return query;
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

// Create a new plan
router.post('/', async (req, res) => {
  try {
    const { name, creatorId } = req.body;
    if (!name || !creatorId) {
      return res.status(400).json({ msg: 'Name and creatorId are required' });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ msg: 'Creator not found' });
    }

    const newPlan = new Plan({
      name,
      creatorId,
      members: [{
        userId: creatorId,
        name: creator.name
      }]
    });

    await newPlan.save();
    res.status(201).json({ msg: 'Plan created', plan: newPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's plans
router.get('/my', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'UserId required' });

    const plans = await Plan.find({
      $or: [
        { creatorId: userId },
        { 'members.userId': userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get plan details
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'UserId required' });

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    if (String(plan.creatorId) !== String(userId)) {
      return res.status(403).json({ msg: 'Only the plan creator can delete this plan' });
    }

    await Plan.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Plan deleted' });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update member location and preference
router.post('/:id/location', async (req, res) => {
  try {
    const { userId, latitude, longitude, preference, travelMode, availability } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const member = plan.members.find(m => m.userId.toString() === userId);
    if (!member) return res.status(404).json({ msg: 'Member not found in plan' });

    member.location = { latitude, longitude };
    member.preference = preference;
    if (travelMode) member.travelMode = travelMode;
    if (Array.isArray(availability)) member.availability = availability;

    // Recalculate midpoint if at least 2 people shared
    const sharedMembers = plan.members.filter(m => m.location && m.location.latitude);
    if (sharedMembers.length >= 1) {
      const avgLat = sharedMembers.reduce((acc, m) => acc + m.location.latitude, 0) / sharedMembers.length;
      const avgLng = sharedMembers.reduce((acc, m) => acc + m.location.longitude, 0) / sharedMembers.length;
      plan.midpoint = { latitude: avgLat, longitude: avgLng };
    }

    await plan.save();
    res.json({ msg: 'Location updated', plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Rank places using travel-time estimates and fairness instead of only a midpoint
router.get('/:id/recommendations', async (req, res) => {
  try {
    const {
      category = 'all',
      radius = 5,
      minRating,
      priceLevel = 'any',
      openNow,
      travelMode,
    } = req.query;
    const debug = {
      route: 'GET /plans/:id/recommendations',
      planId: req.params.id,
      query: { category, radius, minRating, priceLevel, openNow, travelMode },
      provider: 'google',
      googleApiKeyPresent: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      serverTime: new Date().toISOString(),
    };

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const locatedMembers = plan.members.filter((member) => Number.isFinite(member.location?.latitude)
      && Number.isFinite(member.location?.longitude));

    if (locatedMembers.length < 2) {
      return res.status(400).json({ msg: 'At least two members must share locations first' });
    }

    const center = calculateCentroid(locatedMembers);
    plan.midpoint = center;
    await plan.save();

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
      const cachedPlaces = await Place.find(buildPlacesNearQuery({ center, radius, category }))
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

    const recommendations = rankMeetingPlaces({
      plan,
      places,
      travelMode,
      filters: {
        minRating: minRating ? Number(minRating) : undefined,
        priceLevel,
        openNow: openNow === 'true',
      },
    });

    res.json({
      center,
      source,
      ratingNote: debug.outputGoogleRatedPlaceCount > 0
        ? `Google ratings loaded for ${debug.outputGoogleRatedPlaceCount} place(s).`
        : 'Google Places returned no rated places for this search. Open debug to see the exact Google response.',
      recommendations: recommendations.slice(0, 25),
      emergencyAlternatives: getEmergencyAlternatives(recommendations),
      availabilityMatches: getCommonAvailability(plan.members),
      debug: {
        ...debug,
        final: {
          recommendationCount: recommendations.length,
          returnedCount: Math.min(recommendations.length, 25),
          ratedCount: recommendations.filter((place) => Number.isFinite(place.rating)).length,
          googleRatedCount: recommendations.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length,
        },
      },
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({
      msg: 'Server error',
      debug: {
        route: 'GET /plans/:id/recommendations',
        planId: req.params.id,
        error: err.message,
        serverTime: new Date().toISOString(),
      },
    });
  }
});

router.post('/:id/vote', async (req, res) => {
  try {
    const { userId, place } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    if (!userId || !place?.placeId) {
      return res.status(400).json({ msg: 'userId and place are required' });
    }

    plan.votes = plan.votes.filter((vote) => String(vote.userId) !== String(userId));
    plan.votes.push({ userId, placeId: place.placeId, place });

    await plan.save();
    res.json({ msg: 'Vote saved', plan });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/:id/history', async (req, res) => {
  try {
    const { place } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    if (!place?.placeId) return res.status(400).json({ msg: 'place is required' });

    plan.meetingHistory.unshift({ place });
    plan.meetingHistory = plan.meetingHistory.slice(0, 10);

    await plan.save();
    res.json({ msg: 'Meeting added to history', plan });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Invite member to plan
router.post('/:id/invite', async (req, res) => {
  try {
    const { userId, userIds } = req.body;
    const idsToInvite = Array.isArray(userIds) ? userIds : [userId].filter(Boolean);

    if (idsToInvite.length === 0) {
      return res.status(400).json({ msg: 'At least one userId is required' });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const users = await User.find({ _id: { $in: idsToInvite } }).select('name username email');
    if (users.length === 0) return res.status(404).json({ msg: 'No users found' });

    const existingMemberIds = new Set(plan.members.map(m => m.userId.toString()));
    const newUsers = users.filter(user => !existingMemberIds.has(user._id.toString()));

    if (newUsers.length === 0) {
      return res.status(400).json({ msg: 'Selected users are already in this plan' });
    }

    newUsers.forEach(user => {
      plan.members.push({
        userId: user._id,
        name: user.name
      });
    });

    await plan.save();
    res.json({ msg: 'Users invited', invitedCount: newUsers.length, plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
