const pool = require('../db');

exports.getLatestNotifications = async (req, res) => {
  const query = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5';

  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).send({ error: 'Error fetching latest notifications' });
  }
};
