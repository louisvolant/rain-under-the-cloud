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
    new winston.transports.Console(),
  ],
});

// Get all favorites of given user
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

  const { location_name, latitude, longitude, country_code } = req.body; // Destructure country_code

  if (!location_name || latitude == null || longitude == null || !country_code) { // Add country_code to validation
    return res.status(400).json({ error: 'Missing required fields (location_name, latitude, longitude, country_code)' });
  }

  try {
    const existingFavorite = await UserFavoritesModel.findOne({
      user_id: req.session.user.id,
      location_name,
      latitude,
      longitude,
      country_code,
    });

    if (existingFavorite) {
      return res.status(200).json(existingFavorite); // Or return a message indicating it already exists
    }

    apicache.clear('/api/favorites');
    apicache.clear('/api/cached-favorites');

    const newFavorite = new UserFavoritesModel({
      user_id: req.session.user.id,
      location_name,
      longitude,
      latitude,
      country_code,
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

  apicache.clear('/api/favorites');

  try {
    const result = await UserFavoritesModel.findOneAndDelete({
      _id: id,
      user_id: req.session.user.id,
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

// Default number of cached favorites to show
const DEFAULT_CACHED_FAVORITES = 3;


// Get cached favorites of all users (deduplicated, max 3)
router.get('/cached-favorites', async (req, res) => {
  try {
    const allFavorites = await UserFavoritesModel.find({});

    if (!allFavorites || allFavorites.length === 0) {
      logger.info('No cached favorites found.');
      return res.json([]);
    }

    const uniqueFavorites = Array.from(
      new Map(
        allFavorites.map((fav) => [
          `${fav.latitude},${fav.longitude}`, // De-duplication key
          {
            location_name: fav.location_name,
            latitude: fav.latitude,
            longitude: fav.longitude,
            country_code: fav.country_code
          },
        ])
      ).values()
    );

    const cachedFavorites = uniqueFavorites
      .slice(0, DEFAULT_CACHED_FAVORITES)
      .map((fav) => ({
        location_name: fav.location_name,
        lat: fav.latitude,
        lon: fav.longitude,
        country: fav.country_code
      }));

    res.json(cachedFavorites);
  } catch (err) {
    logger.error('Error fetching cached favorites:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;