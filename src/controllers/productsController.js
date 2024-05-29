const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.getProducts = (req, res) => {
  const query = `
    SELECT p.*, b.name as brand_name, c.name as category_name 
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
  const queryColors = `
    SELECT pc.id as product_color_id, pc.color_id, pc.image, c.name as color_name, c.hex_code 
    FROM product_colors pc
    JOIN colors c ON pc.color_id = c.id
    WHERE pc.product_id = ?
  `;
  const queryGallery = `
    SELECT pcg.image, pcg.product_color_id 
    FROM product_color_gallery pcg
    JOIN product_colors pc ON pcg.product_color_id = pc.id
    WHERE pc.product_id = ?
  `;

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

      db.query(queryColors, [productId], (colorsErr, colorsResults) => {
        if (colorsErr) {
          res.status(500).send({ error: 'Error obteniendo los colores del producto' });
        } else {
          product.colors = colorsResults;

          db.query(queryGallery, [productId], (galleryErr, galleryResults) => {
            if (galleryErr) {
              res.status(500).send({ error: 'Error obteniendo la galería del producto' });
            } else {
              const galleryImages = {};
              galleryResults.forEach(gallery => {
                if (!galleryImages[gallery.product_color_id]) {
                  galleryImages[gallery.product_color_id] = [];
                }
                galleryImages[gallery.product_color_id].push(gallery.image);
              });
              product.colors.forEach(color => {
                color.galleryImages = galleryImages[color.product_color_id] || [];
              });
              res.status(200).json(product);
            }
          });
        }
      });
    }
  });
};

exports.createProduct = (req, res) => {
  const { brand_id, category_id, name, price, available_sizes } = req.body;
  const image = req.files.find(file => file.fieldname === 'image');

  if (!image) {
    return res.status(400).send({ error: 'La imagen principal del producto es requerida' });
  }

  const colorsData = JSON.parse(req.body.colors);

  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  const query = 'INSERT INTO products (brand_id, category_id, name, price, image, available_sizes) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [brand_id, category_id, name, price, image.filename, JSON.stringify(sizesArray)], (err, results) => {
    if (err) {
      console.error('Error creando el producto:', err);
      res.status(500).send({ error: 'Error creando el producto', details: err });
    } else {
      const productId = results.insertId;

      const colorQueries = colorsData.map(color => {
        const colorImages = req.files.filter(file => file.fieldname.startsWith(`galleryImages_${color.id}`));
        const query = 'INSERT INTO product_colors (product_id, color_id, image) VALUES (?, ?, ?)';
        return new Promise((resolve, reject) => {
          const colorImage = colorImages.length > 0 ? colorImages[0].filename : null;
          db.query(query, [productId, color.id, colorImage], (colorErr, colorResults) => {
            if (colorErr) {
              return reject(colorErr);
            }
            const productColorId = colorResults.insertId;
            const galleryImages = colorImages.map(file => file.filename);
            const galleryQuery = 'INSERT INTO product_color_gallery (product_color_id, image) VALUES ?';
            const galleryValues = galleryImages.map(img => [productColorId, img]);
            if (galleryValues.length > 0) {
              db.query(galleryQuery, [galleryValues], (galleryErr) => {
                if (galleryErr) {
                  return reject(galleryErr);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      });

      Promise.all(colorQueries)
        .then(() => {
          res.status(201).json({ id: productId, brand_id, category_id, name, price, image: image.filename, available_sizes: sizesArray });
        })
        .catch(error => {
          console.error('Error creando colores del producto:', error);
          res.status(500).send({ error: 'Error creando colores del producto', details: error });
        });
    }
  });
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { brand_id, category_id, name, price, available_sizes } = req.body;
  const image = req.files.find(file => file.fieldname === 'image') || req.body.image;
  const newGalleryImages = req.files.filter(file => file.fieldname.startsWith('galleryImages_')).map(file => file.filename);
  const deletedGalleryImages = JSON.parse(req.body.deletedGalleryImages || '[]');

  let colorsData = [];
  if (Array.isArray(req.body.colors)) {
    colorsData = req.body.colors;
  } else {
    try {
      colorsData = JSON.parse(req.body.colors);
    } catch (error) {
      return res.status(400).send({ error: 'Invalid colors data format' });
    }
  }

  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  const query = 'UPDATE products SET brand_id = ?, category_id = ?, name = ?, price = ?, image = ?, available_sizes = ? WHERE id = ?';
  db.query(query, [brand_id, category_id, name, price, typeof image === 'string' ? image : image.filename, JSON.stringify(sizesArray), productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando el producto' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      if (deletedGalleryImages.length > 0) {
        const deleteGalleryQuery = 'DELETE FROM product_color_gallery WHERE image IN (?)';
        db.query(deleteGalleryQuery, [deletedGalleryImages], (deleteErr) => {
          if (deleteErr) {
            return res.status(500).send({ error: 'Error eliminando imágenes de la galería en la base de datos', details: deleteErr });
          }
        });
      }

      const colorQueries = colorsData.map(color => {
        return new Promise((resolve, reject) => {
          if (color.product_color_id) {
            const updateColorQuery = 'UPDATE product_colors SET color_id = ?, image = ? WHERE id = ?';
            db.query(updateColorQuery, [color.id, color.image, color.product_color_id], (updateErr) => {
              if (updateErr) {
                return reject(updateErr);
              }
              resolve(color.product_color_id);
            });
          } else {
            const insertColorQuery = 'INSERT INTO product_colors (product_id, color_id, image) VALUES (?, ?, ?)';
            db.query(insertColorQuery, [productId, color.id, color.image], (insertErr, insertResults) => {
              if (insertErr) {
                return reject(insertErr);
              }
              resolve(insertResults.insertId);
            });
          }
        });
      });

      Promise.all(colorQueries)
        .then((colorIds) => {
          const galleryQueries = colorIds.map((productColorId, index) => {
            const color = colorsData[index];
            const colorImages = req.files.filter(file => file.fieldname.startsWith(`galleryImages_${color.id}`));
            const galleryImages = colorImages.map(file => file.filename);
            const galleryQuery = 'INSERT INTO product_color_gallery (product_color_id, image) VALUES ?';
            const galleryValues = galleryImages.map(img => [productColorId, img]);
            if (galleryValues.length > 0) {
              return new Promise((resolve, reject) => {
                db.query(galleryQuery, [galleryValues], (galleryErr) => {
                  if (galleryErr) {
                    return reject(galleryErr);
                  }
                  resolve();
                });
              });
            } else {
              return Promise.resolve();
            }
          });

          return Promise.all(galleryQueries);
        })
        .then(() => {
          res.status(200).json({ id: productId, brand_id, category_id, name, price, image: typeof image === 'string' ? image : image.filename, available_sizes: sizesArray });
        })
        .catch(error => {
          res.status(500).send({ error: 'Error actualizando la galería del producto', details: error });
        });
    }
  });
};

exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  const queryGetProduct = 'SELECT image FROM products WHERE id = ?';
  db.query(queryGetProduct, [productId], (err, results) => {
    if (err) {
      console.error('Error obteniendo el producto:', err);
      res.status(500).send({ error: 'Error obteniendo el producto' });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      const product = results[0];

      if (product.image) {
        const imagePath = path.join(__dirname, '../../uploads/products-images', product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Error eliminando la imagen del producto:', err);
          });
        }
      }

      const queryGetGallery = 'SELECT image FROM product_color_gallery WHERE product_color_id IN (SELECT id FROM product_colors WHERE product_id = ?)';
      db.query(queryGetGallery, [productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error obteniendo la galería de imágenes:', galleryErr);
          res.status(500).send({ error: 'Error obteniendo la galería de imágenes' });
        } else {
          const galleryImages = galleryResults.map(g => g.image);

          galleryImages.forEach(image => {
            const galleryImagePath = path.join(__dirname, '../../uploads/product-gallery-images', image);
            if (fs.existsSync(galleryImagePath)) {
              fs.unlink(galleryImagePath, (err) => {
                if (err) console.error('Error eliminando la imagen de la galería:', err);
              });
            }
          });

          const queryDeleteGallery = 'DELETE FROM product_color_gallery WHERE product_color_id IN (SELECT id FROM product_colors WHERE product_id = ?)';
          db.query(queryDeleteGallery, [productId], (deleteGalleryErr) => {
            if (deleteGalleryErr) {
              console.error('Error eliminando la galería del producto:', deleteGalleryErr);
              res.status(500).send({ error: 'Error eliminando la galería del producto' });
            } else {
              const queryDeleteProductColors = 'DELETE FROM product_colors WHERE product_id = ?';
              db.query(queryDeleteProductColors, [productId], (deleteProductColorsErr) => {
                if (deleteProductColorsErr) {
                  console.error('Error eliminando los colores del producto:', deleteProductColorsErr);
                  res.status(500).send({ error: 'Error eliminando los colores del producto' });
                } else {
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
    }
  });
};
