const db = require('../db'); 

exports.getCategories = (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: 'Error obteniendo las categorías' });
    } else {
      res.status(200).json(results);
    }
  });
};

