const express = require('express');
const router = express.Router();
const productsController = require('../controllers/brandsController');

router.get('/', productsController.getBrands);

module.exports = router;
