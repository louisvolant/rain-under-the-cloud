// scripts/migrate_favorites_order.js
require('dotenv').config();

const mongoose_client = require('../config/mongoose');
const { UserFavoritesModel, UsersModel } = require('../dao/userDao');

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});


// --- Configuration ---
const APPLY_CHANGES = false; // Set to 'true' to apply changes, 'false' for a dry run (logging only)
// -------------------

async function migrateFavoritesOrder() {
  logger.info('--- Favorite Order Migration Script ---');
  logger.info(`APPLY_CHANGES is set to: ${APPLY_CHANGES}`);
  logger.info('Connecting to MongoDB...');

  try {
    if (mongoose_client.connection.readyState !== 1) {
      await new Promise(resolve => mongoose_client.connection.on('connected', resolve));
      logger.info('MongoDB Connected successfully for migration.');
    } else {
      logger.info('MongoDB already connected.');
    }

    // Get all unique users who have favorites without an 'order' field
    const usersWithUnorderedFavorites = await UserFavoritesModel.aggregate([
      { $match: { order: { $exists: false } } },
      { $group: { _id: "$user_id" } }
    ]);

    if (usersWithUnorderedFavorites.length === 0) {
      logger.info('\nNo users found with favorites missing an "order" field. Migration complete.');
      return;
    }

    logger.info(`\nFound ${usersWithUnorderedFavorites.length} user(s) with favorites to migrate.`);

    for (const userEntry of usersWithUnorderedFavorites) {
      const userId = userEntry._id;
      const user = await UsersModel.findById(userId);
      const username = user ? user.username : `Unknown User (ID: ${userId})`;

      logger.info(`\n--- Processing favorites for user: ${username} ---`);

      // Find all favorites for the current user that don't have an 'order' field,
      // sorted by their creation _id (which usually reflects insertion order)
      const favoritesToOrder = await UserFavoritesModel.find({
        user_id: userId,
        order: { $exists: false }
      }).sort({ _id: 1 }); // Sorting by _id ensures a consistent, albeit arbitrary, initial order

      if (favoritesToOrder.length === 0) {
        logger.info(`  User ${username} has no favorites requiring initial order assignment.`);
        continue;
      }

      logger.info(`  Found ${favoritesToOrder.length} favorites for user ${username} to assign initial order.`);
      logger.info('  Proposed order changes:');

      const updates = [];
      for (let i = 0; i < favoritesToOrder.length; i++) {
        const fav = favoritesToOrder[i];
        logger.info(`    Favorite ID: ${fav._id}, Location: "${fav.location_name}" - Proposed new order: ${i}`);
        updates.push({
          filter: { _id: fav._id, user_id: userId },
          update: { $set: { order: i } }
        });
      }

      if (APPLY_CHANGES) {
        logger.info('\n  Applying changes to the database...');
        const session = await mongoose_client.startSession();
        session.startTransaction();
        try {
          for (const update of updates) {
            await UserFavoritesModel.updateOne(update.filter, update.update, { session });
          }
          await session.commitTransaction();
          logger.info(`  Successfully applied order for ${updates.length} favorites for user ${username}.`);
        } catch (transactionError) {
          await session.abortTransaction();
          logger.error(`  Error applying changes for user ${username}. Transaction aborted:`, transactionError);
        } finally {
          session.endSession();
        }
      } else {
        logger.info('\n  DRY RUN: Changes were not applied to the database. Set APPLY_CHANGES to true to commit.');
      }
    }

    logger.info('\n--- Favorite Order Migration Script Finished ---');
  } catch (error) {
    logger.error('\nAn error occurred during migration:', error);
  } finally {
    // Ensure the Mongoose connection is closed once done
    if (mongoose_client.connection.readyState === 1) {
      await mongoose_client.disconnect();
      logger.info('MongoDB connection closed.');
    }
  }
}

migrateFavoritesOrder();