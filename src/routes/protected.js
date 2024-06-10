const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

router.get('/protected-route', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

module.exports = router;
