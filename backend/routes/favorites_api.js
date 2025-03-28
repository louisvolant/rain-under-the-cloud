// routes/favorites_api.js
const express = require('express');
const router = express.Router();
const mongoose_client = require('../config/mongoose');
const { UserFavoritesModel } = require('../dao/userDao');
const apicache = require('apicache');

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Get all favorites
router.get('/favorites', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const favorites = await UserFavoritesModel.find({ user_id: req.session.user.id });
    res.json(favorites);
  } catch (err) {
    logger.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a favorite (changed to POST)
router.post('/add-favorite', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { location_name, latitude, longitude } = req.body;

  if (!location_name || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if a favorite with the same location_name, latitude, and longitude already exists for this user
    const existingFavorite = await UserFavoritesModel.findOne({
      user_id: req.session.user.id,
      location_name,
      latitude,
      longitude
    });

    if (existingFavorite) {
      // If it exists, return the existing favorite without saving a new one
      return res.status(200).json(existingFavorite);
    }

    // Clear the cache if you're using apicache
    apicache.clear('/api/favorites');

    // If no duplicate, proceed to save the new favorite
    const newFavorite = new UserFavoritesModel({
      user_id: req.session.user.id,
      location_name,
      longitude,
      latitude
    });
    await newFavorite.save();
    res.status(201).json(newFavorite);
  } catch (err) {
    logger.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a favorite (changed to POST)
router.post('/remove-favorite', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing favorite ID' });
  }

  // Clear the cache if you're using apicache
  apicache.clear('/api/favorites');

  try {
    const result = await UserFavoritesModel.findOneAndDelete({
      _id: id,
      user_id: req.session.user.id // Ensure user can only delete their own favorites
    });

    if (!result) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (err) {
    logger.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;