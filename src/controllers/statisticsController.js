const db = require('../db');

exports.getStatistics = (req, res) => {
  const queries = {
    brands: 'SELECT COUNT(*) AS count FROM brands',
    categories: 'SELECT COUNT(*) AS count FROM categories',
    products: 'SELECT COUNT(*) AS count FROM products'
  };

  const statistics = {};

  db.query(queries.brands, (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error obteniendo estadísticas de marcas' });
    }
    statistics.brands = results[0].count;

    db.query(queries.categories, (err, results) => {
      if (err) {
        return res.status(500).send({ error: 'Error obteniendo estadísticas de categorías' });
      }
      statistics.categories = results[0].count;

      db.query(queries.products, (err, results) => {
        if (err) {
          return res.status(500).send({ error: 'Error obteniendo estadísticas de productos' });
        }
        statistics.products = results[0].count;

        res.status(200).json(statistics);
      });
    });
  });
};
