import User from '../models/User.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



export async function register(req,res){
  try {
    const { name, username, email, password, dateOfBirth } = req.body;
    if (!name || !username || !email || !password || !dateOfBirth) {
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
    });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: `Server error ${err}` });
  }
}


export  async function login (req, res)  {
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

        const token = jwt.sign({
                id:user._id,
                email:user.email
                },
                process.env.JWT_SECRET,
                {expiresIn:"7d"}
        );

    res.status(200).json({ 
        msg: 'Login successful', 
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email    
        }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
}