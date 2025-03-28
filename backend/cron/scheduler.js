const express = require('express');
const router = express.Router();
const { UserFavoritesModel } = require('../dao/userDao');
const { fetchAndSaveDaySummary } = require('../service/oneCallService');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

router.get('/scheduler', async (req, res) => {
  console.log('Starting scheduled check...');
  logger.info('Cron job started at ' + new Date().toISOString());

  try {
    // Step 1: Fetch all favorite locations from the database
    const allFavorites = await UserFavoritesModel.find({});
    if (!allFavorites || allFavorites.length === 0) {
      logger.info('No favorite locations found.');
      return res.status(200).json({ message: 'No favorite locations to process' });
    }

    // Step 2: Remove duplicates based on latitude and longitude
    const uniqueFavorites = Array.from(
      new Map(
        allFavorites.map((fav) => [
          `${fav.latitude},${fav.longitude}`,
          { latitude: fav.latitude, longitude: fav.longitude, location_name: fav.location_name },
        ])
      ).values()
    );
    logger.info(`Found ${uniqueFavorites.length} unique favorite locations after deduplication.`);

    // Step 3: Calculate yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0]; // e.g., "2025-03-28"

    // Step 4: Process each unique favorite location using the refactored function
    const results = await Promise.all(
      uniqueFavorites.map(async (fav) => {
        try {
          const result = await fetchAndSaveDaySummary(fav.latitude, fav.longitude, formattedDate);
          if (result.success) {
            logger.info(`Successfully processed ${fav.location_name} (${fav.latitude}, ${fav.longitude})`);
            return { location: fav.location_name, status: 'success', data: result.data };
          } else {
            logger.error(`Error processing ${fav.location_name}: ${result.error}`);
            return { location: fav.location_name, status: 'error', error: result.error };
          }
        } catch (error) {
          const errorMsg = `Unexpected error processing ${fav.location_name}: ${error.message}`;
          logger.error(errorMsg);
          return { location: fav.location_name, status: 'error', error: errorMsg };
        }
      })
    );

    // Step 5: Summarize results
    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.length - successCount;
    logger.info(`Cron job completed: ${successCount} successes, ${errorCount} errors`);

    res.status(200).json({
      message: 'Scheduled check completed',
      summary: {
        total: results.length,
        successes: successCount,
        errors: errorCount,
        details: results,
      },
    });
  } catch (err) {
    logger.error('Critical error in cron job:', err);
    res.status(500).json({ error: 'Internal server error during scheduled check' });
  }
});

module.exports = router;