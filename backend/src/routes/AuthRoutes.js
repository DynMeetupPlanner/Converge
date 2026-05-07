import express from 'express';
import bcrypt from "bcryptjs";
import User from '../models/User.js';

const router = express.Router();

function formatError(error) {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  return String(error);
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
      email: user.email
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { id, name, email } = req.body;
    if (!id) return res.status(400).json({ msg: 'User ID required' });
    
    // Check if email is already taken by another user
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return res.status(400).json({ msg: 'Email already in use' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.status(200).json({ 
      msg: 'Profile updated', 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // MOCK EMAIL SENDING
    console.log(`[OTP SENT TO ${email}]: ${otp}`);
    
    res.status(200).json({ msg: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Invalid or expired OTP' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordOTP = undefined;
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
    const debug = {
      route: 'GET /users/search',
      rawQuery,
      normalizedQuery: query,
      queryLength: query.length,
      serverTime: new Date().toISOString(),
    };

    console.log('[users/search] incoming query:', debug);

    if (query.length < 2) {
      return res.json({ users: [], debug: { ...debug, reason: 'query_too_short' } });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    debug.escapedQuery = escapedQuery;

    const users = await User.find({
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { username: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } }
      ]
    }).limit(10).select('name username email _id').lean();
    debug.resultCount = users.length;
    debug.resultIds = users.map((user) => String(user._id));

    const formattedUsers = users.map(u => ({
      id: String(u._id),
      name: u.name || u.email || 'User',
      username: u.username || u.email
    }));

    console.log('[users/search] success:', debug);
    res.json({ users: formattedUsers, debug });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({
      msg: 'User search failed',
      debug: {
        route: 'GET /users/search',
        rawQuery: req.query.query,
        error: formatError(err),
        serverTime: new Date().toISOString(),
      }
    });
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
