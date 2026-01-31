const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  upvoteProfile,
  getLeaderboard,
  getStats,
} = require('../controllers/karmaController');

router.post('/upvote', authenticateToken, upvoteProfile);
router.get('/leaderboard', optionalAuth, getLeaderboard);
router.get('/stats', getStats);

module.exports = router;
