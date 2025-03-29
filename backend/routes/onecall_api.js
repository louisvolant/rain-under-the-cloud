// routes/onecall_api.js
const express = require('express');
const router = express.Router();
const {
  fetchAndSaveCurrentWeather,
  fetchHistoricalWeather,
  fetchAndSaveDaySummary,
} = require('../service/oneCallService');

// /onecall endpoint
router.get('/onecall', async (req, res) => {
  const param_units = 'metric';
  const param_lang = 'en';
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and Longitude parameters are required" });
  }

  console.log(`Fetching /onecall for lat=${lat}, lon=${lon}`);

  const result = await fetchAndSaveCurrentWeather(lat, lon, param_units, param_lang);
  if (result.success) {
    res.json(result.data);
  } else {
    console.error('API Error:', result.error);
    res.status(500).json({ error: "Failed to fetch weather data from OpenWeatherMap" });
  }
});

// /onecalltimemachine endpoint
router.get('/onecalltimemachine', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) {
    return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
  }
  console.log(`Fetching /onecalltimemachine for lat=${lat}, lon=${lon}, date=${date}`);

  const result = await fetchHistoricalWeather(lat, lon, date);
  if (result.success) {
    res.json(result.data);
  } else {
    console.error('API Error:', result.error);
    res.status(500).send({ error: "Failed to fetch historical weather data" });
  }
});

// /onecalldaysummary endpoint
router.get('/onecalldaysummary', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) {
    return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
  }

  console.log(`Fetching /onecalldaysummary for lat=${lat}, lon=${lon}, date=${date}`);

  const result = await fetchAndSaveDaySummary(lat, lon, date);
  if (result.success) {
    res.json(result.data);
  } else {
    console.error('API Error:', result.error);
    res.status(500).send({ error: "Failed to fetch daily weather data" });
  }
});

module.exports = router;