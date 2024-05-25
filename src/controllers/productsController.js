const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.getProducts = (req, res) => {
  const query = `
    SELECT p.*, b.name as brand, c.name as category 
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo productos' });
    } else {
      res.status(200).json(results);
    }
  });
};

exports.getProductById = (req, res) => {
  const productId = req.params.id;
  const queryProduct = 'SELECT * FROM products WHERE id = ?';
  const queryGallery = 'SELECT galleryImages FROM product_gallery WHERE product_id = ?';

  db.query(queryProduct, [productId], (err, productResults) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo el producto' });
    } else if (productResults.length === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      const product = productResults[0];
      try {
        product.available_sizes = JSON.parse(product.available_sizes);
      } catch (error) {
        product.available_sizes = [];
      }
      db.query(queryGallery, [productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          res.status(500).send({ error: 'Error obteniendo la galería del producto' });
        } else {
          product.galleryImages = galleryResults.length > 0 ? JSON.parse(galleryResults[0].galleryImages) : [];
          res.status(200).json(product);
        }
      });
    }
  });
};

exports.createProduct = (req, res) => {
  const { brand_id, category_id, name, price, available_sizes, liked } = req.body;
  const image = req.files['image'] ? req.files['image'][0].filename : null;
  const galleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(file => file.filename) : [];

  // Convertir available_sizes a un array
  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  const query = 'INSERT INTO products (brand_id, category_id, name, price, image, available_sizes, liked) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(sizesArray), liked], (err, results) => {
    if (err) {
      console.error('Error creando el producto:', err);
      res.status(500).send({ error: 'Error creando el producto', details: err });
    } else {
      const productId = results.insertId;
      const galleryQuery = 'INSERT INTO product_gallery (product_id, galleryImages) VALUES (?, ?)';
      db.query(galleryQuery, [productId, JSON.stringify(galleryImages)], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error creando la galería:', galleryErr);
          res.status(500).send({ error: 'Error creando la galería', details: galleryErr });
        } else {
          res.status(201).json({ id: productId, brand_id, category_id, name, price, image, available_sizes: sizesArray, liked, galleryImages });
        }
      });
    }
  });
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { brand_id, category_id, name, price, available_sizes, liked } = req.body;
  const image = req.files['image'] ? req.files['image'][0].filename : req.body.image;
  const newGalleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(file => file.filename) : [];
  const deletedGalleryImages = JSON.parse(req.body.deletedGalleryImages || '[]'); // Obtener la lista de imágenes eliminadas

  // Convertir available_sizes a un array
  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  // Eliminar las imágenes físicas del servidor
  deletedGalleryImages.forEach(image => {
    const imagePath = path.join(__dirname, '../../uploads/product-gallery-images', image);
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error eliminando la imagen de la galería:', err);
      });
    }
  });

  // Actualizar el producto en la base de datos
  const query = 'UPDATE products SET brand_id = ?, category_id = ?, name = ?, price = ?, image = ?, available_sizes = ?, liked = ? WHERE id = ?';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(sizesArray), liked, productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando el producto' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      // Obtener las imágenes existentes de la galería
      const galleryQuery = 'SELECT galleryImages FROM product_gallery WHERE product_id = ?';
      db.query(galleryQuery, [productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error obteniendo la galería existente:', galleryErr);
          res.status(500).send({ error: 'Error obteniendo la galería existente', details: galleryErr });
        } else {
          let existingGalleryImages = galleryResults.length > 0 ? JSON.parse(galleryResults[0].galleryImages) : [];
          // Filtrar las imágenes eliminadas
          existingGalleryImages = existingGalleryImages.filter(img => !deletedGalleryImages.includes(img));
          // Agregar las nuevas imágenes a la lista de imágenes existentes
          const updatedGalleryImages = existingGalleryImages.concat(newGalleryImages);

          // Actualizar la galería de imágenes en la base de datos
          const updateGalleryQuery = 'UPDATE product_gallery SET galleryImages = ? WHERE product_id = ?';
          db.query(updateGalleryQuery, [JSON.stringify(updatedGalleryImages), productId], (updateGalleryErr) => {
            if (updateGalleryErr) {
              console.error('Error actualizando la galería:', updateGalleryErr);
              res.status(500).send({ error: 'Error actualizando la galería', details: updateGalleryErr });
            } else {
              res.status(200).json({ id: productId, brand_id, category_id, name, price, image, available_sizes: sizesArray, liked, galleryImages: updatedGalleryImages });
            }
          });
        }
      });
    }
  });
};


exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  // Primero obtenemos la información del producto para eliminar las imágenes asociadas
  const queryGetProduct = 'SELECT image FROM products WHERE id = ?';
  db.query(queryGetProduct, [productId], (err, results) => {
    if (err) {
      console.error('Error obteniendo el producto:', err);
      res.status(500).send({ error: 'Error obteniendo el producto' });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      const product = results[0];

      // Eliminar la imagen principal del producto
      if (product.image) {
        const imagePath = path.join(__dirname, '../../uploads/products-images', product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Error eliminando la imagen del producto:', err);
          });
        }
      }

      // Ahora obtenemos la información de la galería de imágenes para eliminarlas
      const queryGetGallery = 'SELECT galleryImages FROM product_gallery WHERE product_id = ?';
      db.query(queryGetGallery, [productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error obteniendo la galería de imágenes:', galleryErr);
          res.status(500).send({ error: 'Error obteniendo la galería de imágenes' });
        } else {
          const gallery = galleryResults[0];

          // Eliminar las imágenes de la galería
          if (gallery && gallery.galleryImages) {
            const galleryImages = JSON.parse(gallery.galleryImages);
            galleryImages.forEach(image => {
              const galleryImagePath = path.join(__dirname, '../../uploads/product-gallery-images', image);
              if (fs.existsSync(galleryImagePath)) {
                fs.unlink(galleryImagePath, (err) => {
                  if (err) console.error('Error eliminando la imagen de la galería:', err);
                });
              }
            });
          }

          // Eliminar los registros de la galería del producto
          const queryDeleteGallery = 'DELETE FROM product_gallery WHERE product_id = ?';
          db.query(queryDeleteGallery, [productId], (deleteGalleryErr, deleteGalleryResults) => {
            if (deleteGalleryErr) {
              console.error('Error eliminando la galería del producto:', deleteGalleryErr);
              res.status(500).send({ error: 'Error eliminando la galería del producto' });
            } else {
              // Eliminar el registro del producto
              const queryDeleteProduct = 'DELETE FROM products WHERE id = ?';
              db.query(queryDeleteProduct, [productId], (deleteProductErr, deleteProductResults) => {
                if (deleteProductErr) {
                  console.error('Error eliminando el producto:', deleteProductErr);
                  res.status(500).send({ error: 'Error eliminando el producto' });
                } else if (deleteProductResults.affectedRows === 0) {
                  res.status(404).send({ error: 'Producto no encontrado' });
                } else {
                  res.status(204).send();
                }
              });
            }
          });
        }
      });
    }
  });
};
