import express from 'express';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { fetchNearbyPlacesOverpass } from '../services/places/overpass.js';
import {
  calculateCentroid,
  getCommonAvailability,
  getEmergencyAlternatives,
  rankMeetingPlaces,
} from '../services/places/meetingPlanner.js';

const router = express.Router();

function formatError(error) {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  return String(error);
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
    res.json({
      plan,
      debug: {
        route: 'GET /plans/:id',
        planId: req.params.id,
        memberCount: plan.members.length,
        memberIds: plan.members.map((member) => String(member.userId)),
        serverTime: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: 'Server error',
      debug: {
        route: 'GET /plans/:id',
        planId: req.params.id,
        error: formatError(err),
        serverTime: new Date().toISOString(),
      }
    });
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

    const places = await fetchNearbyPlacesOverpass({
      lat: center.latitude,
      lng: center.longitude,
      radiusKm: radius,
      category,
    });

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
      source: 'overpass',
      ratingNote: 'OpenStreetMap/Overpass does not provide public crowd ratings. Ratings are shown only when an optional provider supplies them.',
      recommendations: recommendations.slice(0, 25),
      emergencyAlternatives: getEmergencyAlternatives(recommendations),
      availabilityMatches: getCommonAvailability(plan.members),
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ msg: 'Server error' });
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
    const debug = {
      route: 'POST /plans/:id/invite',
      planId: req.params.id,
      rawBody: req.body,
      normalizedIdsToInvite: idsToInvite,
      serverTime: new Date().toISOString(),
    };

    console.log('[plans/invite] incoming:', debug);

    if (idsToInvite.length === 0) {
      return res.status(400).json({
        msg: 'At least one userId is required',
        debug: {
          ...debug,
          reason: 'empty_user_ids',
        }
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        msg: 'Plan not found',
        debug: {
          ...debug,
          reason: 'plan_not_found',
        }
      });
    }
    debug.existingMemberIds = plan.members.map((member) => member.userId.toString());

    const users = await User.find({ _id: { $in: idsToInvite } }).select('name username email');
    debug.foundUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
    }));

    if (users.length === 0) {
      return res.status(404).json({
        msg: 'No users found',
        debug: {
          ...debug,
          reason: 'no_matching_users',
        }
      });
    }

    const existingMemberIds = new Set(plan.members.map(m => m.userId.toString()));
    const newUsers = users.filter(user => !existingMemberIds.has(user._id.toString()));
    debug.newUsers = newUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
    }));

    if (newUsers.length === 0) {
      return res.status(400).json({
        msg: 'Selected users are already in this plan',
        debug: {
          ...debug,
          reason: 'all_users_already_present',
        }
      });
    }

    newUsers.forEach(user => {
      plan.members.push({
        userId: user._id,
        name: user.name
      });
    });

    await plan.save();
    debug.finalMemberIds = plan.members.map((member) => member.userId.toString());
    debug.invitedCount = newUsers.length;
    console.log('[plans/invite] success:', debug);
    res.json({ msg: 'Users invited', invitedCount: newUsers.length, plan, debug });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: 'Server error',
      debug: {
        route: 'POST /plans/:id/invite',
        planId: req.params.id,
        rawBody: req.body,
        error: formatError(err),
        serverTime: new Date().toISOString(),
      }
    });
  }
});

export default router;
