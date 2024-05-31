const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productsController = require('../controllers/productsController');

// Configurar Multer para la imagen principal del producto
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/products-images');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar Multer para las imágenes de la galería del producto
const galleryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/product-gallery-images');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'image' || file.fieldname === 'image2') {
        cb(null, path.join(__dirname, '../../uploads/products-images'));
      } else if (file.fieldname.startsWith('galleryImages_')) {
        cb(null, path.join(__dirname, '../../uploads/product-gallery-images'));
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fieldSize: 25 * 1024 * 1024,
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image' || file.fieldname === 'image2' || file.fieldname.startsWith('galleryImages_')) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  }
});

router.get('/latest', productsController.getLatestProducts);

router.post('/', upload.any(), productsController.createProduct);
router.put('/:id', upload.any(), productsController.updateProduct);
router.get('/', productsController.getProducts);
router.get('/brand/:brandId', productsController.getProductsByBrand);
router.get('/:id', productsController.getProductById);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
