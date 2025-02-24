//routes/api.js

const express = require('express');
const router = express.Router();

router.use(require('./search_api'));
router.use(require('./forecast_api'));
router.use(require('./weather_api'));
router.use(require('./precipitation_api'));
router.use(require('./onecall_api'));

module.exports = router;
