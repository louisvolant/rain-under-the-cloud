// routes/api.js
const express = require('express');
const router = express.Router();

router.use(require('./search_api'));
router.use(require('./forecast_api'));
router.use(require('./weather_api'));
router.use(require('./precipitation_api'));
router.use(require('./onecall_api'));


router.use(require('./account_api'));
router.use(require('./password_api'));
router.use(require('./registration_api'));

module.exports = router;