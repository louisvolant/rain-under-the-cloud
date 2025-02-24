//routes/location_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const API_KEY = process.env.OPENWEATHER_API_KEY;

router.get('/onecall', async (req, res) => {
    const { lat, lon, date } = req.query;
    if (!lat || !lon || !date) {
        return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
    }

    // Convert date to Unix timestamp (assuming date is in 'YYYY-MM-DD' format)
    const timestamp = new Date(date).getTime() / 1000; // Convert to seconds

    try {
        const response = await axios.get('https://api.openweathermap.org/data/3.0/onecall/timemachine', {
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

    try {
        const response = await axios.get('https://api.openweathermap.org/data/3.0/onecall/day_summary', {
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
