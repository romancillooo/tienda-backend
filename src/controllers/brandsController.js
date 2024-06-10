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
  const image = req.files['image'] ? req.files['image'][0].filename : null;
  const banner = req.files['banner'] ? req.files['banner'][0].filename : null;
  const query = 'INSERT INTO brands (name, image, banner, path) VALUES (?, ?, ?, ?)';
  try {
    const [results] = await pool.query(query, [name, image, banner, path]);
    res.status(201).json({ id: results.insertId, name, image, banner, path });
  } catch (err) {
    res.status(500).send({ error: 'Error creando la marca' });
  }
};

exports.updateBrand = async (req, res) => {
  const brandId = req.params.id;
  const { name, path } = req.body;

  // Obtener la imagen y el banner actuales si no se proporciona una nueva imagen
  let image = req.body.image;
  let banner = req.body.banner;

  if (req.files['image']) {
    image = req.files['image'][0].filename;
  }

  if (req.files['banner']) {
    banner = req.files['banner'][0].filename;
  }

  const query = 'UPDATE brands SET name = ?, image = ?, banner = ?, path = ? WHERE id = ?';
  try {
    const [results] = await pool.query(query, [name, image, banner, path, brandId]);
    if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(200).json({ id: brandId, name, image, banner, path });
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
