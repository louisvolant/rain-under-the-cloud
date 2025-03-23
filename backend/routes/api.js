// routes/api.js
const express = require('express');
const router = express.Router();

// Import each route file and use it as middleware
const searchApi = require('./search_api');
const forecastApi = require('./forecast_api');
const weatherApi = require('./weather_api');
const precipitationApi = require('./precipitation_api');
const onecallApi = require('./onecall_api');
const accountApi = require('./account_api');
const passwordApi = require('./password_api');
const registrationApi = require('./registration_api');

// Use each router
router.use('/search', searchApi);
router.use('/forecast', forecastApi);
router.use('/weather', weatherApi);
router.use('/precipitation', precipitationApi);
router.use('/onecall', onecallApi);
router.use('/account', accountApi);
router.use('/password', passwordApi);
router.use('/register', registrationApi);

module.exports = router;