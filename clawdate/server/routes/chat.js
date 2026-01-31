const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getChat,
  sendMessage,
  getUserChats,
} = require('../controllers/chatController');

router.get('/', authenticateToken, getUserChats);
router.get('/:matchId', authenticateToken, getChat);
router.post('/:matchId', authenticateToken, sendMessage);

module.exports = router;
