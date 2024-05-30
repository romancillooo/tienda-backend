const pool = require('../db');

exports.getBrands = async (req, res) => {
  const query = 'SELECT * FROM brands';
  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).send({ error: 'Error obteniendo marcas' });
  }
};

exports.getBrandById = async (req, res) => {
  const brandId = req.params.id;
  const query = 'SELECT * FROM brands WHERE id = ?';
  try {
    const [results] = await pool.query(query, [brandId]);
    if (results.length === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(200).json(results[0]);
    }
  } catch (err) {
    res.status(500).send({ error: 'Error obteniendo la marca' });
  }
};

exports.createBrand = async (req, res) => {
  const { name, path } = req.body;
  const image = req.file.filename; // Solo guarda el nombre del archivo
  const query = 'INSERT INTO brands (name, image, path) VALUES (?, ?, ?)';
  try {
    const [results] = await pool.query(query, [name, image, path]);
    res.status(201).json({ id: results.insertId, name, image, path });
  } catch (err) {
    res.status(500).send({ error: 'Error creando la marca' });
  }
};

exports.updateBrand = async (req, res) => {
  const brandId = req.params.id;
  const { name, path } = req.body;
  const image = req.file ? req.file.filename : req.body.image; // Solo guarda el nombre del archivo si se ha subido uno nuevo
  const query = 'UPDATE brands SET name = ?, image = ?, path = ? WHERE id = ?';
  try {
    const [results] = await pool.query(query, [name, image, path, brandId]);
    if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(200).json({ id: brandId, name, image, path });
    }
  } catch (err) {
    res.status(500).send({ error: 'Error actualizando la marca' });
  }
};

exports.deleteBrand = async (req, res) => {
  const brandId = req.params.id;
  const query = 'DELETE FROM brands WHERE id = ?';
  try {
    const [results] = await pool.query(query, [brandId]);
    if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send({ error: 'Error eliminando la marca' });
  }
};
