import express from 'express';
import Plan from '../models/Plan.js';
import User from '../models/User.js';

const router = express.Router();

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

// Update member location and preference
router.post('/:id/location', async (req, res) => {
  try {
    const { userId, latitude, longitude, preference } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const member = plan.members.find(m => m.userId.toString() === userId);
    if (!member) return res.status(404).json({ msg: 'Member not found in plan' });

    member.location = { latitude, longitude };
    member.preference = preference;

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

// Invite member to plan
router.post('/:id/invite', async (req, res) => {
  try {
    const { userId } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (plan.members.some(m => m.userId.toString() === userId)) {
      return res.status(400).json({ msg: 'User already in plan' });
    }

    plan.members.push({
      userId,
      name: user.name
    });

    await plan.save();
    res.json({ msg: 'User invited', plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
