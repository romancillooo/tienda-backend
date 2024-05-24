const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const brandsController = require('../controllers/brandsController');

// Configurar Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/brands-logos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', brandsController.getBrands);
router.get('/:id', brandsController.getBrandById);
router.post('/', upload.single('image'), brandsController.createBrand); // Usar Multer aquí
router.put('/:id', upload.single('image'), brandsController.updateBrand); // Usar Multer aquí
router.delete('/:id', brandsController.deleteBrand);

module.exports = router;
