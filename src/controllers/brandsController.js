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
