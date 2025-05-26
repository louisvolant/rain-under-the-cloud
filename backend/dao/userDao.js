// dao/userDao.js
const mongoose = require('../config/mongoose');

const usersSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const UsersModel = mongoose.model('Users', usersSchema, 'Users');

const passwordResetTokensSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  token: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});
const UserPasswordResetTokensModel = mongoose.model('UserPasswordResetTokens', passwordResetTokensSchema, 'UserPasswordResetTokens');

const userFavoritesSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  location_name: { type: String, required: true },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
  country_code: { type: String, required: true }
});
const UserFavoritesModel = mongoose.model('UserFavorites', userFavoritesSchema, 'UserFavorites');

module.exports = { UsersModel, UserPasswordResetTokensModel, UserFavoritesModel };