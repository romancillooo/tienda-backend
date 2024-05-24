const db = require('../db'); 

exports.getCategories = (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo categorías' });
    } else {
      res.status(200).json(results);
    }
  });
};

exports.getCategoryById = (req, res) => {
  const categoryId = req.params.id;
  const query = 'SELECT * FROM categories WHERE id = ?';
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo la categoría' });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(200).json(results[0]);
    }
  });
};

exports.createCategory = (req, res) => {
  const { name, path } = req.body;
  const query = 'INSERT INTO categories (name, path) VALUES (?, ?)';
  db.query(query, [name, path], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error creando la categoría' });
    } else {
      res.status(201).json({ id: results.insertId, name, path });
    }
  });
};

exports.updateCategory = (req, res) => {
  const categoryId = req.params.id;
  const { name, path } = req.body;
  const query = 'UPDATE categories SET name = ?, path = ? WHERE id = ?';
  db.query(query, [name, path, categoryId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando la categoría' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(200).json({ id: categoryId, name, path });
    }
  });
};

exports.deleteCategory = (req, res) => {
  const categoryId = req.params.id;
  const query = 'DELETE FROM categories WHERE id = ?';
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error eliminando la categoría' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(204).send();
    }
  });
};
