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
    const cachedFavoritesPipeline = [
      // 1. Group by location (name, lat, lon, country_code) to find unique locations
      //    We use $first to pick the 'order' from the first document encountered in each group.
      //    Since we sort by order ascending later, this will effectively pick the lowest order.
      {
        $group: {
          _id: {
            location_name: "$location_name",
            latitude: "$latitude",
            longitude: "$longitude",
            country_code: "$country_code",
          },
          // Find the minimum order for this unique location
          minOrder: { $min: "$order" },
          // Keep one example of the full favorite document to extract other fields later
          // $first or $push could be used, but $first is simpler if we just need the values.
          // Note: If multiple users have the same location with the same minOrder, this picks one arbitrarily.
          // For simplicity, we just use the grouped fields directly for the final output.
        },
      },
      // 2. Project to reshape the output and include the minimum order
      {
        $project: {
          _id: 0, // Exclude the _id from the output
          location_name: "$_id.location_name",
          latitude: "$_id.latitude",
          longitude: "$_id.longitude",
          country_code: "$_id.country_code",
          order: "$minOrder", // This is the lowest order found for this specific location
        },
      },
      // 3. Sort by the minimum order to get the "most preferred" locations first
      {
        $sort: { order: 1 },
      },
      // 4. Limit to the desired number of top cached favorites
      {
        $limit: DEFAULT_CACHED_FAVORITES,
      },
    ];

    const topCachedFavorites = await UserFavoritesModel.aggregate(cachedFavoritesPipeline);

    if (!topCachedFavorites || topCachedFavorites.length === 0) {
      logger.info('No cached favorites found after aggregation.');
      return res.json([]);
    }

    // Map the aggregated results to the desired frontend format
    const formattedFavorites = topCachedFavorites.map((fav) => ({
      location_name: fav.location_name,
      lat: fav.latitude,
      lon: fav.longitude,
      country: fav.country_code,
    }));

    res.json(formattedFavorites);
  } catch (err) {
    logger.error('Error fetching cached favorites with aggregation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;