//routes/password_api.js
const express = require('express');
const router = express.Router();
const mongoose_client = require('../config/mongoose');
const { UsersModel, UserPasswordResetTokensModel, UserFavoritesModel } = require('../dao/userDao');
const { hashPasswordArgon2 } = require('../utils/PasswordUtils');
const crypto = require('crypto');
const winston = require('winston');
const Mailjet = require('node-mailjet');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET
});

// Request password reset
router.post('/password_reset/request', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email exists
      // Example with Supabase but we need to use Mangoose
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (error || !user) {
      return res.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token
      // Example with Supabase but we need to use Mangoose
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      logger.error('Failed to store reset token:', tokenError);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/passwordrenew?token=${token}`;
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: {
          Email: process.env.MAILJET_SENDER_EMAIL,
          Name: "Your App"
        },
        To: [{
          Email: email
        }],
        Subject: "Password Reset Request",
        TextPart: `Click this link to reset your password: ${resetUrl}`,
        HTMLPart: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 24 hours.</p>`
      }]
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error in password reset request:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify reset token
router.get('/password_reset/verify', async (req, res) => {
  const { token } = req.query;

  try {
      // Example with Supabase but we need to use Mangoose
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !data || new Date(data.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Invalid or expired token' });
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error verifying reset token:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Reset password
router.post('/password_reset/reset', async (req, res) => {
  const { token, newpassword } = req.body;

  try {
    // Verify token
      // Example with Supabase but we need to use Mangoose
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await hashPasswordArgon2(newpassword);

    // Update password
      // Example with Supabase but we need to use Mangoose
    const { error: updateError } = await supabase
      .from('users')
      .update({
        hashed_password: hashedPassword,
        password_version: 1
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      logger.error('Failed to update password:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to reset password' });
    }

    // Delete used token
      // Example with Supabase but we need to use Mangoose
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error in password reset:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;