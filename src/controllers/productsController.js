const db = require('../db');

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
  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo el producto' });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      res.status(200).json(results[0]);
    }
  });
};

exports.createProduct = (req, res) => {
  const { brand_id, category_id, name, price, available_sizes, liked } = req.body;
  const image = req.files['image'] ? req.files['image'][0].filename : null;
  const galleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(file => file.filename) : [];

  const query = 'INSERT INTO products (brand_id, category_id, name, price, image, available_sizes, liked) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(available_sizes.split(',').map(size => size.trim())), liked], (err, results) => {
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
          res.status(201).json({ id: productId, brand_id, category_id, name, price, image, available_sizes, liked, galleryImages });
        }
      });
    }
  });
};


exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { brand_id, category_id, name, price, available_sizes, liked } = req.body;
  const image = req.files['image'] ? req.files['image'][0].filename : req.body.image;
  const galleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(file => file.filename) : [];

  const query = 'UPDATE products SET brand_id = ?, category_id = ?, name = ?, price = ?, image = ?, available_sizes = ?, liked = ? WHERE id = ?';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(available_sizes.split(',').map(size => size.trim())), liked, productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando el producto' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      const galleryQuery = 'UPDATE product_gallery SET galleryImages = ? WHERE product_id = ?';
      db.query(galleryQuery, [JSON.stringify(galleryImages), productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error actualizando la galería:', galleryErr);
          res.status(500).send({ error: 'Error actualizando la galería', details: galleryErr });
        } else {
          res.status(200).json({ id: productId, brand_id, category_id, name, price, image, available_sizes, liked, galleryImages });
        }
      });
    }
  });
};

exports.deleteProduct = (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error eliminando el producto' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      const galleryQuery = 'DELETE FROM product_gallery WHERE product_id = ?';
      db.query(galleryQuery, [productId], (galleryErr, galleryResults) => {
        if (galleryErr) {
          console.error('Error eliminando la galería:', galleryErr);
          res.status(500).send({ error: 'Error eliminando la galería', details: galleryErr });
        } else {
          res.status(204).send();
        }
      });
    }
  });
};
