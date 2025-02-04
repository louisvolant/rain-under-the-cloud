require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEOCODING_API = "http://api.openweathermap.org/geo/1.0/direct";
const FORECAST_API_V2 = "http://api.openweathermap.org/data/2.5/forecast";
const WEATHER_API_V2 = "http://api.openweathermap.org/data/2.5/weather";

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000' // Allow requests from frontend
}));

// Route for getlocation
app.get('/getlocation', async (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.status(400).send({ error: "City parameter is required" });
    }

    try {
        const response = await axios.get(GEOCODING_API, {
            params: {
                q: city,
                appid: API_KEY,
                limit: '3',
                lang: 'en'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send({ error: "Failed to fetch location data" });
    }
});

// Route for getforecast
app.get('/getforecast', async (req, res) => {
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
        res.status(500).send({ error: "Failed to fetch forecast data" });
    }
});

// Route for getweather
app.get('/getweather', async (req, res) => {
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
        res.status(500).send({ error: "Failed to fetch weather data" });
    }
});

app.get('/getprecipitations', async (req, res) => {
    const { lat, lon, date } = req.query;
    if (!lat || !lon || !date) {
        return res.status(400).send({ error: "Latitude, Longitude and Date parameters are required" });
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

app.get('/onecall', async (req, res) => {
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

app.get('/onecalldaysummary', async (req, res) => {
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

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));