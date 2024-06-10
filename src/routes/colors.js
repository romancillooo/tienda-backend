const express = require('express');
const router = express.Router();
const colorsController = require('../controllers/colorsController');

// Rutas para colores
router.get('/', colorsController.getAllColors);
router.get('/:id', colorsController.getColorById);
router.post('/', colorsController.createColor);
router.put('/:id', colorsController.updateColor);
router.delete('/:id', colorsController.deleteColor);

module.exports = router;
