const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createHandshake,
  getHandshakes,
  verifyHandshake,
} = require('../controllers/handshakeController');

router.post('/', authenticateToken, createHandshake);
router.get('/:matchId', authenticateToken, getHandshakes);
router.get('/verify/:handshakeId', verifyHandshake);

module.exports = router;
