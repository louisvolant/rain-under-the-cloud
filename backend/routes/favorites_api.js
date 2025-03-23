//routes/favorites_api.js

const express = require('express');
const router = express.Router();
const mongoose_client = require('../config/mongoose');
const { UserFavoritesModel } = require('../dao/userDao');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Favorites route
router.get('/favorites', async (req, res) => {
 if (!req.session.user) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 try {
 const favorites = await Favorite.find({ user_id: req.session.user.id });
 res.json(favorites);
 } catch (err) {
 res.status(500).json({ error: 'Internal server error' });
 }
});