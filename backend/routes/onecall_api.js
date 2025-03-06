//routes/onecall_api.js

const express = require('express');
const axios = require('axios');
const router = express.Router();
const API_KEY = process.env.OPENWEATHER_API_KEY;
const ONECALL_V3_API = "https://api.openweathermap.org/data/3.0/onecall";
const ONECALL_V3_TIMEMACHINE_API = "https://api.openweathermap.org/data/3.0/onecall/timemachine";
const ONECALL_V3_DAY_SUMMARY_API = "https://api.openweathermap.org/data/3.0/onecall/day_summary";
const mongoose = require('mongoose');

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));


// Define Mongoose Schemas and Models
const weatherOnCallSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    units: String,
    lang: String,
    data: Object,
});
const WeatherOnCallModel = mongoose.model('WeatherOnCall', weatherOnCallSchema, 'WeatherOnCall'); //Third parameter forces the collection name.

const weatherOnCallDaySummarySchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    date: String,
    data: Object,
});
const WeatherOnCallDaySummaryModel = mongoose.model('WeatherOnCallDaySummary', weatherOnCallDaySummarySchema, 'WeatherOnCallDaySummary'); //Third parameter forces the collection name.


router.get('/onecall', async (req, res) => {
    const param_units = 'metric';
    const param_lang = 'en';
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude parameters are required" });
    }

    console.log(`Fetching /onecall for lat=${lat}, lon=${lon}`);

    try {

        // Check if data already exists in MongoAtlas
        const existingData = await WeatherOnCallModel.findOne({
        latitude: lat,
        longitude: lon,
        units: param_units,
        lang: param_lang
         });
        if (existingData) {
            console.info('Data (WeatherOnCallModel) for lat=' + lat + ', lon=' + lon + ' fetched from Internal MongoDB');
            return res.json(existingData.data);
        }

    } catch (error) {
        console.error('API Error:', error);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch weather data from internal DB" });
    }

    try {

        // Fetch data from OpenWeatherMap if not in MongoDB
        const response = await axios.get(ONECALL_V3_API, {
            params: { lat, lon, appid: API_KEY, units: param_units, lang: param_lang }
        });

        const data = response.data;

        // Save the new data to MongoDB
        const newWeatherOnCall = new WeatherOnCallModel({
            latitude: lat,
            longitude: lon,
            units: param_units,
            lang: param_lang,
            data: data,
        });

        await newWeatherOnCall.save();
        console.log('Data (newWeatherOnCall) for lat=' + lat + ', lon=' + lon + ' saved to MongoDB');

        res.json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch weather data from OpenWeatherMap" });
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

    //const formattedDate = formatDateToYYYYMMDD(date);
    const formattedDate = date;
    try {

        // Check if data already exists in MongoAtlas
        const existingData = await WeatherOnCallDaySummaryModel.findOne({
        latitude: lat,
        longitude: lon,
        date: formattedDate
         });
        if (existingData) {
            console.info('Data (WeatherOnCallDaySummaryModel) for lat=' + lat + ', lon=' + lon + ', date=' + formattedDate + ' fetched from Internal MongoDB');
            return res.json(existingData.data);
        }

    } catch (error) {
        console.error('API Error:', error);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch weather Day Summary data from internal DB" });
    }

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

        const data = response.data;

        // Save the new data to MongoDB
        const weatherOnCallDaySummary = new WeatherOnCallDaySummaryModel({
            latitude: lat,
            longitude: lon,
            date: formattedDate,
            data: data,
        });

        await weatherOnCallDaySummary.save();
        console.log('Data (weatherOnCallDaySummary) for lat=' + lat + ', lon=' + lon + ', date=' + formattedDate + ' saved to MongoDB');

        res.json(data);
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
