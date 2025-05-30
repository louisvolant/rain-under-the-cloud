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
    new winston.transports.Console(),
  ],
});

// Get all favorites of given user, sorted by order
router.get('/favorites', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch favorites sorted by the 'order' field
    const favorites = await UserFavoritesModel.find({ user_id: req.session.user.id }).sort({ order: 1 });
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

    // Get the highest current order for the user's favorites
    const highestOrderFavorite = await UserFavoritesModel.findOne({ user_id: req.session.user.id })
      .sort({ order: -1 })
      .limit(1);

    const newOrder = highestOrderFavorite ? highestOrderFavorite.order + 1 : 0; // Assign the next available order

    apicache.clear('/api/favorites');
    apicache.clear('/api/cached-favorites');

    const newFavorite = new UserFavoritesModel({
      user_id: req.session.user.id,
      location_name,
      longitude,
      latitude,
      country_code,
      order: newOrder,
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
  apicache.clear('/api/cached-favorites'); // Clear cached favorites too

  try {
    const result = await UserFavoritesModel.findOneAndDelete({
      _id: id,
      user_id: req.session.user.id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    // After removing, re-index the remaining favorites to maintain sequential order
    const remainingFavorites = await UserFavoritesModel.find({ user_id: req.session.user.id }).sort({ order: 1 });
    for (let i = 0; i < remainingFavorites.length; i++) {
      if (remainingFavorites[i].order !== i) { // Only update if order needs to change
        remainingFavorites[i].order = i;
        await remainingFavorites[i].save();
      }
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (err) {
    logger.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// New endpoint to reorder favorites
router.post('/reorder-favorites', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderedFavoriteIds } = req.body; // Expect an array of favorite IDs in the desired order

  if (!Array.isArray(orderedFavoriteIds) || orderedFavoriteIds.some(id => typeof id !== 'string')) {
    return res.status(400).json({ error: 'Invalid input: orderedFavoriteIds must be an array of strings' });
  }

  apicache.clear('/api/favorites'); // Clear cache for favorites
  apicache.clear('/api/cached-favorites'); // Clear cached favorites too

  try {
    // Start a Mongoose session for transaction-like behavior
    const session = await mongoose_client.startSession();
    session.startTransaction();

    try {
      for (let i = 0; i < orderedFavoriteIds.length; i++) {
        const favoriteId = orderedFavoriteIds[i];
        // Update the order for each favorite based on its position in the array
        await UserFavoritesModel.findOneAndUpdate(
          { _id: favoriteId, user_id: req.session.user.id },
          { $set: { order: i } },
          { new: true, session } // 'new: true' returns the updated document, 'session' for transaction
        );
      }

      await session.commitTransaction();
      res.json({ message: 'Favorites reordered successfully' });
    } catch (transactionError) {
      await session.abortTransaction();
      logger.error('Transaction failed during reorder:', transactionError);
      res.status(500).json({ error: 'Failed to reorder favorites due to a transaction error' });
    } finally {
      session.endSession();
    }
  } catch (err) {
    logger.error('Error starting session for reorder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Default number of cached favorites to show
const DEFAULT_CACHED_FAVORITES = 3;


// Get cached favorites of all users (deduplicated, max 3)
router.get('/cached-favorites', async (req, res) => {
  try {
    // Fetch all favorites, sorted by order
    const allFavorites = await UserFavoritesModel.find({}).sort({ order: 1 });

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
            country_code: fav.country_code,
            order: fav.order, // Include order in the unique map
          },
        ])
      ).values()
    );

    // Sort unique favorites by order if the de-duplication changes the order
    uniqueFavorites.sort((a, b) => a.order - b.order);


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