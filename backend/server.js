// server.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // connect-mongo v5.1.0
const cors = require('cors');
const mongoose = require('./config/mongoose'); // Import your mongoose connection

const app = express();

const apicache = require('apicache');
const apiRoutes = require('./routes/api');
const scheduler = require('./cron/scheduler');

// Initialize apicache with a 1 hour cache duration
const cache = apicache.middleware('1 minute', (req, res) => req.method === 'GET'); // Only cache GET requests

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  credentials: true // Allow credentials
}));

// Define MongoDB URI (consistent with config/mongoose.js)
const MONGO_URI = `mongodb+srv://${process.env.MONGODB_ATLAS_USERNAME}:${process.env.MONGODB_ATLAS_PASSWORD}@${process.env.MONGODB_ATLAS_CLUSTER_URL}/${process.env.MONGODB_ATLAS_DB_NAME}?retryWrites=true&w=majority&appName=${process.env.MONGODB_ATLAS_APP_NAME}`;

// Session Middleware with MongoStore
app.use(session({
  name: 'session',
  secret: process.env.SESSION_COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI, // Explicitly provide the MongoDB URI
    collectionName: 'sessions', // Specify the collection name
    ttl: 24 * 60 * 60, // Session TTL set to 1 day (24 hours) in seconds
    autoRemove: 'native' // Let MongoDB handle session cleanup
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production (requires HTTPS)
    sameSite: 'Lax', // Avoid excessive browser restrictions
    maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds (24 hours)
  }
}));

// Apply caching middleware to all /api/ routes
app.use('/api/', cache, apiRoutes); // Add cache middleware before the routes
app.use('/cron/', scheduler);

const PORT = process.env.PORT || 3001;

// Ensure MongoDB is connected before starting the server
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if MongoDB fails to connect
});