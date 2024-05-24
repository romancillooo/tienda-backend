const db = require('../db');

exports.getBrands = (req, res) => {
  const query = 'SELECT * FROM brands';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo marcas' });
    } else {
      res.status(200).json(results);
    }
  });
};

exports.getBrandById = (req, res) => {
  const brandId = req.params.id;
  const query = 'SELECT * FROM brands WHERE id = ?';
  db.query(query, [brandId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo la marca' });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(200).json(results[0]);
    }
  });
};

exports.createBrand = (req, res) => {
  const { name, path } = req.body;
  const image = req.file.filename; // Solo guarda el nombre del archivo
  const query = 'INSERT INTO brands (name, image, path) VALUES (?, ?, ?)';
  db.query(query, [name, image, path], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error creando la marca' });
    } else {
      res.status(201).json({ id: results.insertId, name, image, path });
    }
  });
};

exports.updateBrand = (req, res) => {
  const brandId = req.params.id;
  const { name, path } = req.body;
  const image = req.file ? req.file.filename : req.body.image; // Solo guarda el nombre del archivo si se ha subido uno nuevo
  const query = 'UPDATE brands SET name = ?, image = ?, path = ? WHERE id = ?';
  db.query(query, [name, image, path, brandId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error actualizando la marca' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(200).json({ id: brandId, name, image, path });
    }
  });
};

exports.deleteBrand = (req, res) => {
  const brandId = req.params.id;
  const query = 'DELETE FROM brands WHERE id = ?';
  db.query(query, [brandId], (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error eliminando la marca' });
    } else if (results.affectedRows === 0) {
      res.status(404).send({ error: 'Marca no encontrada' });
    } else {
      res.status(204).send();
    }
  });
};
