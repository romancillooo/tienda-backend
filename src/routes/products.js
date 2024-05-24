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

const productImageUpload = multer({ storage: productImageStorage });
const galleryImageUpload = multer({ storage: galleryImageStorage });

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "image") {
        cb(null, path.join(__dirname, '../../uploads/products-images'));
      } else if (file.fieldname === "galleryImages") {
        cb(null, path.join(__dirname, '../../uploads/product-gallery-images'));
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProductById);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), productsController.createProduct);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
