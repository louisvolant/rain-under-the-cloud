//routes/forecast_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const FORECAST_API_V2 = "http://api.openweathermap.org/data/2.5/forecast";
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Route for forecast
router.get('/forecast', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).send({ error: "Latitude and Longitude parameters are required" });
    }

    try {
        const response = await axios.get(FORECAST_API_V2, {
            params: {
                lat: lat,
                lon: lon,
                appid: API_KEY,
                units: 'metric',
                lang: 'en'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching forecast data:", error.response ? error.response.data : error.message);
        res.status(500).send({ error: "Failed to fetch forecast data" });
    }
});

module.exports = router;