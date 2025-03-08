//routes/search_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const GEOCODING_API = "http://api.openweathermap.org/geo/1.0/direct";
const API_KEY = process.env.OPENWEATHER_API_KEY;
const { getLocationSearch, saveLocationSearch } = require('../dao/searchDao');

// Route for search
router.get('/search', async (req, res) => {
    const param_lang = 'en';
    const city = req.query.city;
    if (!city) {
        return res.status(400).send({ error: "City parameter is required" });
    }

    try {

        // Check if data already exists in MongoAtlas
        const existingData = await getLocationSearch(city, param_lang);
        if (existingData) {
            return res.json(existingData.data);
        }

        const response = await axios.get(GEOCODING_API, {
            params: {
                q: city,
                appid: API_KEY,
                limit: '3',
                lang: param_lang
            }
        });

        const data = response.data;

        // Save the new data to MongoDB
        await saveLocationSearch(city, param_lang, data);

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching location data:", error.response ? error.response.data : error.message);
        res.status(500).send({ error: "Failed to fetch location data" });
    }
});

module.exports = router;

