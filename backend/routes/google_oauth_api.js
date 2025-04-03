// routes/google_oauth_api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { UsersModel } = require('../dao/userDao');
const crypto = require('crypto');
const { hashPasswordArgon2 } = require('../utils/PasswordUtils'); // Import your hashing util

// Generate a strong random password
const generateStrongPassword = () => {
  return crypto.randomBytes(16).toString('base64') // 16 bytes = ~22 chars of base64
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special chars for simplicity
    .slice(0, 16) // Ensure length
    + crypto.randomInt(1000, 9999); // Add numbers for strength
};

// Google OAuth redirect URL
router.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(url);
});

// Google OAuth callback
router.get('/auth/callback/google', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email, name } = userInfo.data;

    // Check if user exists by email (case-insensitive)
    let userData = await UsersModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!userData) {
      // Generate a random username (e.g., "user_<random_string>")
      const randomString = crypto.randomBytes(4).toString('hex');
      const username = `user_${randomString}`;

      // Generate and hash a strong random password
      const randomPassword = generateStrongPassword();
      const hashedPassword = await hashPasswordArgon2(randomPassword);

      // Create new user
      userData = new UsersModel({
        username,
        email,
        hashed_password: hashedPassword,
        created_at: new Date(),
      });
      await userData.save();
    }

    // Set session in the same format as login_api.js
    req.session.user = { id: userData._id, username: userData.username };

    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;