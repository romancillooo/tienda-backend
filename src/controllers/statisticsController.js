const pool = require('../db');

exports.getStatistics = async (req, res) => {
  const queries = {
    brands: 'SELECT COUNT(*) as count FROM brands',
    categories: 'SELECT COUNT(*) as count FROM categories',
    products: 'SELECT COUNT(*) as count FROM products',
    orders: 'SELECT COUNT(*) as count FROM orders',
    notifications: 'SELECT COUNT(*) as count FROM notifications'
  };

  const statistics = {};

  try {
    for (const key in queries) {
      const [rows] = await pool.query(queries[key]);
      statistics[key] = rows[0].count;
    }
    res.status(200).json(statistics);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics', details: error });
  }
};
