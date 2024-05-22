const db = require('../db'); 

exports.getProducts = (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo productos' });
    } else {
      res.status(200).json(results);
    }
  });
};

