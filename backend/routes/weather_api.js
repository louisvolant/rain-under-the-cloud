//routes/location_api.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const WEATHER_API_V2 = "http://api.openweathermap.org/data/2.5/weather";
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Route for weather
router.get('/weather', async (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.status(400).send({ error: "City parameter is required" });
    }

    try {
        const response = await axios.get(WEATHER_API_V2, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric',
                lang: 'en'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching weather data:", error.response ? error.response.data : error.message);
        res.status(500).send({ error: "Failed to fetch weather data" });
    }
});

module.exports = router;
