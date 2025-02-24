//routes/precipitation_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const API_KEY = process.env.OPENWEATHER_API_KEY;


router.get('/precipitations', async (req, res) => {
    const { lat, lon, date } = req.query;
    if (!lat || !lon || !date) {
        return res.status(400).send({ error: "Latitude, Longitude and date parameters are required" });
    }

    // Convert date to Unix timestamp (assuming date is in 'YYYY-MM-DD' format)
    const startDate = new Date(date).setHours(0, 0, 0, 0) / 1000; // Start of day
    const endDate = new Date(date).setHours(23, 59, 59, 999) / 1000; // End of day

    try {
        // Log request before sending
        console.log('Requesting precipitation data with:', {
            url: 'http://history.openweathermap.org/data/2.5/history/accumulated_temperature',
            params: {
                lat: lat,
                lon: lon,
                start: startDate,
                end: endDate,
                appid: API_KEY
            }
        });

        const response = await axios.get('http://history.openweathermap.org/data/2.5/history/accumulated_temperature', {
            params: {
                lat: lat,
                lon: lon,
                start: startDate,
                end: endDate,
                appid: API_KEY
            }
        });

        // Log API response
        console.log('API Response:', response.data);

        res.json(response.data);
    } catch (error) {
        // Log error received from API
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        res.status(500).send({ error: "Failed to fetch precipitation data" });
    }
});

module.exports = router;
