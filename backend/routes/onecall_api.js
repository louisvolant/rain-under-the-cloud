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

async function fetchAndSaveMonthSummary(lat, lon, year, month) {
    try {
        const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date object
        const endDate = new Date(year, month, 0); // Last day of the month

        const dailySummaries = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const formattedDate = currentDate.toISOString().split('T')[0];
            const dayResult = await fetchAndSaveDaySummary(lat, lon, formattedDate); // Reuse existing day summary logic
            if (dayResult.success) {
                dailySummaries.push(dayResult.data);
            } else {
                console.warn(`Could not fetch data for ${formattedDate}:`, dayResult.error);
                // Decide how to handle missing days: skip, add empty data, or throw error
                // For now, we'll just push what we get, or handle errors gracefully
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return { success: true, data: dailySummaries };
    } catch (error) {
        console.error('Error in fetchAndSaveMonthSummary:', error);
        return { success: false, error: error.message };
    }
}

// /onecallmonthsummary endpoint
router.get('/onecallmonthsummary', async (req, res) => {
  const { lat, lon, year, month } = req.query;
  if (!lat || !lon || !year || !month) {
    return res.status(400).send({ error: "Latitude, Longitude, Year, and Month parameters are required" });
  }

  console.log(`Fetching /onecallmonthsummary for lat=${lat}, lon=${lon}, year=${year}, month=${month}`);

  const result = await fetchAndSaveMonthSummary(lat, lon, parseInt(year), parseInt(month));
  if (result.success) {
    res.json(result.data);
  } else {
    console.error('API Error:', result.error);
    res.status(500).send({ error: "Failed to fetch monthly weather data" });
  }
});

module.exports = router;