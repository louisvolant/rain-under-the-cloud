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
        // startDate: Always the 1st of the requested month.
        // 'month - 1' converts the 1-indexed 'month' parameter to a 0-indexed month for the Date constructor.
        const startDate = new Date(year, month - 1, 1);
        const today = new Date();

        console.info("startdate:"+startDate+" / today:"+today);
        let endDate;

        // Check if the requested month and year is the CURRENT month and year.
        // Compare the 1-indexed 'month' parameter with today.getMonth() + 1.
        if (year === today.getFullYear() && month === (today.getMonth() + 1)) {
            // If it's the current month, the endDate should be today's date.
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        } else {
            // If it's a past or future month, get the actual last day of THAT requested month.
            // Create a Date object for the 1st day of the *next* month (using the 1-indexed 'month' directly
            // as the month argument for the Date constructor results in the *next* month due to 0-indexing).
            endDate = new Date(year, month, 1); // This correctly creates the 1st day of the *next* month (e.g., July 1st for month=6 June)
            endDate.setDate(endDate.getDate() - 1); // Subtract one day to get the last day of the *current* requested month (e.g., June 30th)
        }
        console.info("enddate:"+endDate);

        const dailySummaries = [];
        let currentDate = new Date(startDate);

        // Reset hours, minutes, seconds, milliseconds for accurate date-only comparison
        // It's crucial that these dates are treated as local dates for the loop
        currentDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        // today.setHours(0, 0, 0, 0); // No longer strictly needed for comparison inside loop, but good practice if 'today' were used in loop logic

        console.info("currentDate (normalized):"+currentDate+" / today (raw):"+today+" / enddate (normalized):"+endDate);

        // Loop from startDate to endDate (inclusive)
        while (currentDate <= endDate) {
            // Get date components in local time and format them manually
            const yearPart = currentDate.getFullYear();
            const monthPart = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // month is 0-indexed, so add 1
            const dayPart = currentDate.getDate().toString().padStart(2, '0');

            const formattedDate = `${yearPart}-${monthPart}-${dayPart}`;

            console.info("formattedDate:"+formattedDate+" / currentDate:"+currentDate);
            const dayResult = await fetchAndSaveDaySummary(lat, lon, formattedDate);
            if (dayResult.success) {
                dailySummaries.push(dayResult.data);
            } else {
                console.warn(`Could not fetch data for ${formattedDate}:`, dayResult.error);
            }
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
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