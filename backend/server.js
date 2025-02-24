// server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  credentials: true // Allow credentials
}));

// Routes
app.use('/api/', apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});