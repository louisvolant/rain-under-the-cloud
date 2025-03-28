const axios = require('axios');
const API_KEY = process.env.OPENWEATHER_API_KEY;
const ONECALL_V3_API = "https://api.openweathermap.org/data/3.0/onecall";
const ONECALL_V3_TIMEMACHINE_API = "https://api.openweathermap.org/data/3.0/onecall/timemachine";
const ONECALL_V3_DAY_SUMMARY_API = "https://api.openweathermap.org/data/3.0/onecall/day_summary";
const { getWeatherOnCall, saveWeatherOnCall, getWeatherOnCallDaySummary, saveWeatherOnCallDaySummary } = require('../dao/onecallDao');

// Fetch and save current weather data (for /onecall)
async function fetchAndSaveCurrentWeather(lat, lon, units = 'metric', lang = 'en') {
  try {
    // Check if data already exists in MongoDB
    const existingData = await getWeatherOnCall(lat, lon, units, lang);
    if (existingData) {
      return { success: true, data: existingData.data };
    }

    // Fetch data from OpenWeatherMap if not in MongoDB
    const response = await axios.get(ONECALL_V3_API, {
      params: { lat, lon, appid: API_KEY, units, lang },
    });

    const data = response.data;

    // Save the new data to MongoDB
    await saveWeatherOnCall(lat, lon, units, lang, data);

    return { success: true, data };
  } catch (error) {
    const errorMsg = error.response
      ? `API Error: ${error.response.status} - ${error.response.data.message || "Failed to fetch weather data"}`
      : `Error: ${error.message}`;
    return { success: false, error: errorMsg };
  }
}

// Fetch historical weather data (for /onecalltimemachine)
async function fetchHistoricalWeather(lat, lon, date, units = 'metric', lang = 'en') {
  const timestamp = new Date(date).getTime() / 1000; // Convert to Unix timestamp in seconds

  try {
    const response = await axios.get(ONECALL_V3_TIMEMACHINE_API, {
      params: { lat, lon, dt: timestamp, appid: API_KEY, units, lang },
    });

    const data = response.data;
    return { success: true, data };
  } catch (error) {
    const errorMsg = error.response
      ? `API Error: ${error.response.status} - ${error.response.data.message || "Failed to fetch historical weather data"}`
      : `Error: ${error.message}`;
    return { success: false, error: errorMsg };
  }
}

// Fetch and save day summary data (for /onecalldaysummary)
async function fetchAndSaveDaySummary(lat, lon, date) {
  const formattedDate = date;

  try {
    // Check if data already exists in MongoDB
    const existingData = await getWeatherOnCallDaySummary(lat, lon, formattedDate);
    if (existingData) {
      return { success: true, data: existingData.data };
    }

    // Fetch data from OpenWeatherMap if not in MongoDB
    const response = await axios.get(ONECALL_V3_DAY_SUMMARY_API, {
      params: {
        lat,
        lon,
        date,
        appid: API_KEY,
        units: 'metric', // Hardcoded as per your example
        lang: 'en',      // Hardcoded as per your example
      },
    });

    const data = response.data;

    // Save the new data to MongoDB
    await saveWeatherOnCallDaySummary(lat, lon, formattedDate, data);

    return { success: true, data };
  } catch (error) {
    const errorMsg = error.response
      ? `API Error: ${error.response.status} - ${error.response.data.message || "Failed to fetch daily weather data"}`
      : `Error: ${error.message}`;
    return { success: false, error: errorMsg };
  }
}

module.exports = {
  fetchAndSaveCurrentWeather,
  fetchHistoricalWeather,
  fetchAndSaveDaySummary,
};