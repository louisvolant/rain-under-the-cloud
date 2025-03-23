// routes/registration_api.js
const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const winston = require('winston');
const { UsersModel, UserPasswordResetTokensModel, UserFavoritesModel } = require('../dao/userDao');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});


const hashPasswordArgon2 = async (password) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};

// Registration route
router.post('/register', async (req, res) => {
 const { username, email, password } = req.body;

 try {
 const existingUser = await User.findOne({ $or: [{ username }, { email }] });
 if (existingUser) {
 return res.status(409).json({ error: 'Username or email already exists' });
 }

 const hashedPassword = await hashPasswordArgon2(password);
 const user = new User({ username, email, hashed_password: hashedPassword });
 await user.save();

 req.session.user = { id: user._id, username };
 res.json({ success: true });
 } catch (err) {
 res.status(500).json({ error: 'Server error' });
 }
});

module.exports = router;