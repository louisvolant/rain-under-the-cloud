// cron/scheduler.js
const express = require('express');
const router = express.Router();

router.get('/scheduler', async (req, res) => {
  console.log('Starting scheduled check...');
    //TODO
  console.log('Mail sending completed:', mailResult);

  res.status(200).json({ message: 'Scheduled check completed' });
});

module.exports = router;


