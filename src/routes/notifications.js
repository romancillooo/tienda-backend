const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.get('/latest', notificationsController.getLatestNotifications);

module.exports = router;
