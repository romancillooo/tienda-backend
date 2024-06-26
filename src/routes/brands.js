const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const brandsController = require('../controllers/brandsController');

// Configurar Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, path.join(__dirname, '../../uploads/brands-logos'));
    } else if (file.fieldname === 'banner') {
      cb(null, path.join(__dirname, '../../uploads/brands-banners'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', brandsController.getBrands);
router.get('/:id', brandsController.getBrandById);
router.post('/', upload.fields([{ name: 'image' }, { name: 'banner' }]), brandsController.createBrand); // Usar Multer aquí
router.put('/:id', upload.fields([{ name: 'image' }, { name: 'banner' }]), brandsController.updateBrand); // Usar Multer aquí
router.delete('/:id', brandsController.deleteBrand);

module.exports = router;
