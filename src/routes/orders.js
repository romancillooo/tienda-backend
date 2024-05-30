const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

router.get('/latest', ordersController.getLatestOrders);

module.exports = router;
