const pool = require('../db');

exports.getCategories = async (req, res) => {
  const query = 'SELECT * FROM categories';
  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).send({ error: 'Error obteniendo categorías' });
  }
};

exports.getCategoryById = async (req, res) => {
  const categoryId = req.params.id;
  const query = 'SELECT * FROM categories WHERE id = ?';
  try {
    const [results] = await pool.query(query, [categoryId]);
    if (results.length === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(200).json(results[0]);
    }
  } catch (err) {
    res.status(500).send({ error: 'Error obteniendo la categoría' });
  }
};

exports.createCategory = async (req, res) => {
  const { name, path } = req.body;
  const query = 'INSERT INTO categories (name, path) VALUES (?, ?)';
  try {
    const [results] = await pool.query(query, [name, path]);
    res.status(201).json({ id: results.insertId, name, path });
  } catch (err) {
    res.status (500).send({ error: 'Error creando la categoría' });
  }
};

exports.updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { name, path } = req.body;
  const query = 'UPDATE categories SET name = ?, path = ? WHERE id = ?';
  try {
    const [results] = await pool.query(query, [name, path, categoryId]);
    if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(200).json({ id: categoryId, name, path });
    }
  } catch (err) {
    res.status(500).send({ error: 'Error actualizando la categoría' });
  }
};

exports.deleteCategory = async (req, res) => {
  const categoryId = req.params.id;
  const query = 'DELETE FROM categories WHERE id = ?';
  try {
    const [results] = await pool.query(query, [categoryId]);
    if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Categoría no encontrada' });
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send({ error: 'Error eliminando la categoría' });
  }
};
