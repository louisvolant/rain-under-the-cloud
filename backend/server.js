// server.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const apicache = require('apicache');
const apiRoutes = require('./routes/api');
const scheduler = require('./cron/scheduler');

const app = express();

// Initialize apicache with a 1 hour cache duration
const cache = apicache.middleware('1 minute', (req, res) => req.method === 'GET'); // Only cache GET requests

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  credentials: true // Allow credentials
}));

app.use(session({
  name: "session",
  secret: process.env.SESSION_COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' // Avoid excessive browser restrictions
  }
}));

// Apply caching middleware to all /api/ routes
app.use('/api/', cache, apiRoutes); // Add cache middleware before the routes
app.use('/cron/', scheduler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});