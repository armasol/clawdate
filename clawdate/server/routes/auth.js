const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  requestChallenge,
  verifyChallenge,
  getProfile,
  updateProfile,
} = require('../controllers/authController');

// Public routes
router.post('/challenge', requestChallenge);
router.post('/verify', verifyChallenge);

// Protected routes
router.get('/profile', authenticateToken, getProfile);outer.put('/profile', authenticateToken, updateProfile);

module.exports = router;
