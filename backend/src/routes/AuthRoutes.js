import express from 'express';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import User from '../models/User.js';
import { sendPasswordResetOtpEmail } from '../services/email/resend.js';

const router = express.Router();
const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_OTP_DIGITS = 6;

function generateNumericOtp() {
  const min = 10 ** (PASSWORD_RESET_OTP_DIGITS - 1);
  const max = (10 ** PASSWORD_RESET_OTP_DIGITS) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

function hashOtpForUser(userId, otp) {
  return crypto.createHash('sha256').update(`${String(userId)}:${String(otp)}`).digest('hex');
}

function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function toPublicUser(userDoc) {
  return {
    id: String(userDoc._id),
    name: userDoc.name || userDoc.email || 'User',
    username: userDoc.username || userDoc.email,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, dateOfBirth, gender } = req.body;
    if (!name || !username || !email || !password || !dateOfBirth || !gender) {
      return res.status(400).json({ msg: 'All fields required' });
    }
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime()) || dob >= new Date() ) {
      return res.status(400).json({ msg: 'Invalid date of birth' });
    }
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      username,
      email,
      passwordHash,
      dateOfBirth: dob,
      gender,
    });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    res.status(200).json({ msg: 'Login successful', user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      preferredSpotType: user.preferredSpotType || 'cafe',
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { id, name, email, username, preferredSpotType } = req.body;
    if (!id) return res.status(400).json({ msg: 'User ID required' });
    
    // Check if email is already taken by another user
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return res.status(400).json({ msg: 'Email already in use' });
    }

    if (username) {
      const normalizedUsername = String(username).trim().toLowerCase();
      if (normalizedUsername.length < 3) {
        return res.status(400).json({ msg: 'Username must be at least 3 characters' });
      }
      const usernameExists = await User.findOne({ username: normalizedUsername, _id: { $ne: id } });
      if (usernameExists) return res.status(400).json({ msg: 'Username already in use' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (username) user.username = String(username).trim().toLowerCase();
    if (preferredSpotType) user.preferredSpotType = preferredSpotType;

    await user.save();
    res.status(200).json({ 
      msg: 'Profile updated', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        preferredSpotType: user.preferredSpotType || 'cafe',
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ msg: 'Email required' });

    const user = await User.findOne({ email });
    if (user) {
      const otp = generateNumericOtp();
      user.resetPasswordOTPHash = hashOtpForUser(user._id, otp);
      user.resetPasswordExpires = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
      await user.save();
      await sendPasswordResetOtpEmail({
        to: user.email,
        otp,
        name: user.name,
        expiresMinutes: Math.round(PASSWORD_RESET_OTP_TTL_MS / 60000),
      });
    }

    res.status(200).json({ msg: 'If an account exists for this email, a reset code has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Unable to send reset code right now. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedEmail || !normalizedOtp || !newPassword) {
      return res.status(400).json({ msg: 'Email, OTP, and new password are required' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.resetPasswordOTPHash || !user.resetPasswordExpires) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    if (new Date(user.resetPasswordExpires).getTime() <= Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const inputHash = hashOtpForUser(user._id, normalizedOtp);
    if (inputHash !== user.resetPasswordOTPHash) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordOTPHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const rawQuery = Array.isArray(req.query.query) ? req.query.query[0] : req.query.query;
    const query = String(rawQuery || '').trim();
    if (query.length < 2) {
      return res.json({ users: [] });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { username: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } }
      ]
    }).limit(10).select('name username email _id').lean();

    res.json({ users: users.map(toPublicUser) });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ msg: 'User search failed' });
  }
});

router.get('/friends', async (req, res) => {
  try {
    const rawUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    const userId = String(rawUserId || '').trim();
    if (!userId) return res.status(400).json({ msg: 'userId required' });

    const user = await User.findById(userId).select('friends').lean();
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const friends = await User.find({ _id: { $in: user.friends || [] } })
      .select('name username email _id')
      .sort({ name: 1 })
      .lean();

    res.json({ friends: friends.map(toPublicUser) });
  } catch (err) {
    console.error('Friends fetch error:', err);
    res.status(500).json({ msg: 'Friends fetch failed' });
  }
});

router.delete('/friends/:friendId', async (req, res) => {
  try {
    const rawUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    const userId = String(rawUserId || '').trim();
    const friendId = String(req.params.friendId || '').trim();
    if (!userId || !friendId) return res.status(400).json({ msg: 'userId and friendId required' });

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);
    if (!user || !friend) return res.status(404).json({ msg: 'User not found' });

    user.friends = (user.friends || []).filter((id) => String(id) !== String(friend._id));
    friend.friends = (friend.friends || []).filter((id) => String(id) !== String(user._id));

    await Promise.all([user.save(), friend.save()]);

    const friends = await User.find({ _id: { $in: user.friends || [] } })
      .select('name username email _id')
      .sort({ name: 1 })
      .lean();

    res.json({ msg: 'Friend removed', friends: friends.map(toPublicUser) });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ msg: 'Remove friend failed' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const rawUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    const userId = String(rawUserId || '').trim();
    if (!userId) return res.status(400).json({ msg: 'userId required' });

    const user = await User.findById(userId)
      .select('friendRequestsIncoming friendRequestsOutgoing')
      .lean();
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const incomingIds = (user.friendRequestsIncoming || []).map((r) => r.fromUserId).filter(Boolean);
    const outgoingIds = (user.friendRequestsOutgoing || []).map((r) => r.toUserId).filter(Boolean);

    const [incomingUsers, outgoingUsers] = await Promise.all([
      User.find({ _id: { $in: incomingIds } }).select('name username email _id').lean(),
      User.find({ _id: { $in: outgoingIds } }).select('name username email _id').lean(),
    ]);

    res.json({
      incoming: incomingUsers.map(toPublicUser),
      outgoing: outgoingUsers.map(toPublicUser),
    });
  } catch (err) {
    console.error('Requests fetch error:', err);
    res.status(500).json({ msg: 'Requests fetch failed' });
  }
});

router.post('/friend-request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) return res.status(400).json({ msg: 'fromUserId and toUserId required' });
    if (String(fromUserId) === String(toUserId)) return res.status(400).json({ msg: 'Cannot friend yourself' });

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
    ]);
    if (!fromUser || !toUser) return res.status(404).json({ msg: 'User not found' });

    const alreadyFriends = (fromUser.friends || []).some((id) => String(id) === String(toUser._id));
    if (alreadyFriends) return res.status(400).json({ msg: 'Already friends' });

    const outgoingExists = (fromUser.friendRequestsOutgoing || []).some((r) => String(r.toUserId) === String(toUser._id));
    const incomingExists = (fromUser.friendRequestsIncoming || []).some((r) => String(r.fromUserId) === String(toUser._id));

    // If they already requested you, accept immediately.
    if (incomingExists) {
      fromUser.friendRequestsIncoming = (fromUser.friendRequestsIncoming || []).filter((r) => String(r.fromUserId) !== String(toUser._id));
      toUser.friendRequestsOutgoing = (toUser.friendRequestsOutgoing || []).filter((r) => String(r.toUserId) !== String(fromUser._id));

      fromUser.friends = Array.from(new Set([...(fromUser.friends || []).map(String), String(toUser._id)])).map((id) => id);
      toUser.friends = Array.from(new Set([...(toUser.friends || []).map(String), String(fromUser._id)])).map((id) => id);

      await Promise.all([fromUser.save(), toUser.save()]);
      return res.json({ msg: 'Friend request accepted', status: 'friends' });
    }

    if (outgoingExists) return res.status(400).json({ msg: 'Request already sent' });

    fromUser.friendRequestsOutgoing = fromUser.friendRequestsOutgoing || [];
    toUser.friendRequestsIncoming = toUser.friendRequestsIncoming || [];

    fromUser.friendRequestsOutgoing.push({ toUserId: toUser._id, createdAt: new Date() });
    toUser.friendRequestsIncoming.push({ fromUserId: fromUser._id, createdAt: new Date() });

    await Promise.all([fromUser.save(), toUser.save()]);
    res.json({ msg: 'Friend request sent', status: 'requested' });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ msg: 'Friend request failed' });
  }
});

router.post('/friend-request/accept', async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;
    if (!userId || !fromUserId) return res.status(400).json({ msg: 'userId and fromUserId required' });

    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId),
    ]);
    if (!user || !fromUser) return res.status(404).json({ msg: 'User not found' });

    // Clear any pending requests in either direction (handles crossed requests / duplicates).
    user.friendRequestsIncoming = (user.friendRequestsIncoming || []).filter((r) => String(r.fromUserId) !== String(fromUser._id));
    user.friendRequestsOutgoing = (user.friendRequestsOutgoing || []).filter((r) => String(r.toUserId) !== String(fromUser._id));
    fromUser.friendRequestsOutgoing = (fromUser.friendRequestsOutgoing || []).filter((r) => String(r.toUserId) !== String(user._id));
    fromUser.friendRequestsIncoming = (fromUser.friendRequestsIncoming || []).filter((r) => String(r.fromUserId) !== String(user._id));

    user.friends = Array.from(new Set([...(user.friends || []).map(String), String(fromUser._id)])).map((id) => id);
    fromUser.friends = Array.from(new Set([...(fromUser.friends || []).map(String), String(user._id)])).map((id) => id);

    await Promise.all([user.save(), fromUser.save()]);
    res.json({ msg: 'Friend request accepted' });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ msg: 'Accept friend request failed' });
  }
});

router.post('/friend-request/reject', async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;
    if (!userId || !fromUserId) return res.status(400).json({ msg: 'userId and fromUserId required' });

    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId),
    ]);
    if (!user || !fromUser) return res.status(404).json({ msg: 'User not found' });

    user.friendRequestsIncoming = (user.friendRequestsIncoming || []).filter((r) => String(r.fromUserId) !== String(fromUser._id));
    fromUser.friendRequestsOutgoing = (fromUser.friendRequestsOutgoing || []).filter((r) => String(r.toUserId) !== String(user._id));

    await Promise.all([user.save(), fromUser.save()]);
    res.json({ msg: 'Friend request rejected' });
  } catch (err) {
    console.error('Reject friend request error:', err);
    res.status(500).json({ msg: 'Reject friend request failed' });
  }
});

export default router;
/*
router
    .route("/test")
    .get()...
    .post()...

Format for writing multiple statements at once

*/
