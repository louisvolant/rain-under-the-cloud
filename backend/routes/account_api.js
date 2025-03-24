// routes/account_api.js
const express = require('express');
const router = express.Router();
const { hashPasswordArgon2, verifyPassword } = require('../utils/PasswordUtils');
const { UsersModel, UserFavoritesModel } = require('../dao/userDao');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

  try {
    const user = await UsersModel.findOne(isEmail ? { email: username } : { username });

    if (!user || !(await verifyPassword(password, user.hashed_password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    req.session.user = { id: user._id, username: user.username };
    return res.json({ success: true });
  } catch (err) {
    logger.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change Password route
router.post('/changepassword', async (req, res) => {
  const { newpassword } = req.body;

  if (!req.session.user) {
    logger.info('Attempted password change without authentication');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please log in first'
    });
  }

  try {
    const hashedPassword = await hashPasswordArgon2(newpassword);

    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.session.user.id,
      { hashed_password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      logger.info('No user found for update:', req.session.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('Password changed successfully for user:', req.session.user.username);
    return res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error in changepassword route:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).json({ error: 'Logout failed' });
    else res.clearCookie('session').json({ success: true });
  });
});

router.post('/delete_my_account', async (req, res) => {
  if (!req.session.user) {
    logger.info('Attempted account deletion without authentication');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please log in first'
    });
  }

  const userId = req.session.user.id;

  try {
    // Delete all favorites
    await UserFavoritesModel.deleteMany({ user_id: userId });

    // Delete the account
    await UsersModel.findByIdAndDelete(userId);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction failed:', err);
        return res.status(500).json({
          success: false,
          error: 'Account deleted but session cleanup failed'
        });
      }

      res.clearCookie('session').json({
        success: true,
        message: 'Account and all associated data successfully deleted'
      });
    });
  } catch (error) {
    logger.error('Account deletion failed:', {
      message: error.message,
      userId: userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      details: error.message
    });
  }
});

module.exports = router;