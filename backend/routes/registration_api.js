// routes/registration_api.js
const express = require('express');
const router = express.Router();
const winston = require('winston');
const { UsersModel } = require('../dao/userDao');
const { hashPasswordArgon2 } = require('../utils/PasswordUtils');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Validation rules
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateInput = (username, email, password) => {
  if (!username || username.length <= 6) {
    return 'Username must be more than 6 characters';
  }
  if (!email || !emailRegex.test(email)) {
    return 'Email must be a valid email address';
  }
  if (!password || password.length < 15) {
    return 'Password must be at least 15 characters';
  }
  return null;
};

// Registration route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  logger.info('Registration attempt', { username, email });

  // Validate inputs
  const validationError = validateInput(username, email, password);
  if (validationError) {
    logger.warn('Validation failed', { username, email, error: validationError });
    return res.status(400).json({ error: validationError });
  }

  try {
    // Check for existing username or email (case-insensitive)
    const existingUser = await UsersModel.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      ],
    });

    if (existingUser) {
      let errorMessage = '';
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        errorMessage = 'Username already exists';
      } else if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        errorMessage = 'Email already exists';
      }
      logger.info('Duplicate found', { username, email, existing: existingUser });
      return res.status(409).json({ error: errorMessage });
    }

    const hashedPassword = await hashPasswordArgon2(password);
    const user = new UsersModel({
      username,
      email,
      hashed_password: hashedPassword,
    });

    await user.save();
    logger.info('User registered successfully', { username, userId: user._id });

    req.session.user = { id: user._id, username };
    res.json({ success: true });
  } catch (err) {
    logger.error('Registration failed', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;