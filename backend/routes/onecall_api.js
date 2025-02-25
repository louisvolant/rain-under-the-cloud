//routes/onecall_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const API_KEY = process.env.OPENWEATHER_API_KEY;
const ONECALL_V3_API = "https://api.openweathermap.org/data/3.0/onecall";
const ONECALL_V3_TIMEMACHINE_API = "https://api.openweathermap.org/data/3.0/onecall/timemachine";
const ONECALL_V3_DAY_SUMMARY_API = "https://api.openweathermap.org/data/3.0/onecall/day_summary";


router.get('/onecall', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude parameters are required" });
    }

    console.log(`Fetching /onecall for lat=${lat}, lon=${lon}`);

    try {
        const response = await axios.get(ONECALL_V3_API, {
            params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'en' }
        });

        const data = response.data;

        res.json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch weather data" });
    }
});

router.get('/onecalltimemachine', async (req, res) => {
    const { lat, lon, date } = req.query;
    if (!lat || !lon || !date) {
        return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
    }
    console.log(`Fetching /onecalltimemachine for lat=${lat}, lon=${lon}, date=${date}`);

    // Convert date to Unix timestamp (assuming date is in 'YYYY-MM-DD' format)
    const timestamp = new Date(date).getTime() / 1000; // Convert to seconds

    try {
        const response = await axios.get(ONECALL_V3_TIMEMACHINE_API, {
            params: {
                lat: lat,
                lon: lon,
                dt: timestamp,
                appid: API_KEY,
                units: 'metric', // Using metric by default for Celsius units
                lang: 'en' // For English descriptions
            }
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        res.status(500).send({ error: "Failed to fetch historical weather data" });
    }
});

router.get('/onecalldaysummary', async (req, res) => {
    const { lat, lon, date } = req.query;
    if (!lat || !lon || !date) {
        return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
    }

    console.log(`Fetching /onecalldaysummary for lat=${lat}, lon=${lon}, date=${date}`);

    try {
        const response = await axios.get(ONECALL_V3_DAY_SUMMARY_API, {
            params: {
                lat: lat,
                lon: lon,
                date: date,
                appid: API_KEY,
                units: 'metric', // Or 'imperial' or 'standard'
                lang: 'en'       // For English descriptions
            }
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
            res.status(error.response.status).send({ error: error.response.data.message || "Failed to fetch daily weather data" });
        } else {
            console.error('Error:', error.message);
            res.status(500).send({ error: "Failed to fetch daily weather data" });
        }
    }
});

module.exports = router;
