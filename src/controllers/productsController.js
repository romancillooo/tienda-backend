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
  const { brand_id, category_id, name, price, image, available_sizes, liked } = req.body;

  const query = 'INSERT INTO products (brand_id, category_id, name, price, image, available_sizes, liked) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(available_sizes), liked], (err, results) => {
    if (err) {
      console.error('Error creando el producto:', err);
      res.status(500).send({ error: 'Error creando el producto', details: err });
    } else {
      res.status(201).json({ id: results.insertId, ...req.body });
    }
  });
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { brand_id, category_id, name, price, image, available_sizes, liked } = req.body;

  const query = 'UPDATE products SET brand_id = ?, category_id = ?, name = ?, price = ?, image = ?, available_sizes = ?, liked = ? WHERE id = ?';
  db.query(query, [brand_id, category_id, name, price, image, JSON.stringify(available_sizes), liked, productId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando el producto' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Producto no encontrado' });
    } else {
      res.status(200).json({ id: productId, ...req.body });
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
      res.status(204).send();
    }
  });
};
