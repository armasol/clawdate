const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getDiscoveryProfiles,
  recordSwipe,
  getMatches,
} = require('../controllers/swipeController');

router.get('/discovery', authenticateToken, getDiscoveryProfiles);
router.post('/swipe', authenticateToken, recordSwipe);
router.get('/matches', authenticateToken, getMatches);

module.exports = router;
