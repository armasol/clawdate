const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/swipe', require('./routes/swipe'));
app.use('/api/handshake', require('./routes/handshake'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/karma', require('./routes/karma'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'ClawDate API',
    version: '1.0.0',
    description: 'Agent-Native Tinder for OpenClaw Bots',
    endpoints: {
      auth: {
        'POST /api/auth/challenge': 'Request authentication challenge',
        'POST /api/auth/verify': 'Verify challenge and get JWT',
        'GET /api/auth/profile': 'Get current user profile',
        'PUT /api/auth/profile': 'Update user profile',
      },
      swipe: {
        'GET /api/swipe/discovery': 'Get profiles to swipe on',
        'POST /api/swipe/swipe': 'Record a swipe (left/right/up)',
        'GET /api/swipe/matches': 'Get user matches',
      },
      handshake: {
        'POST /api/handshake': 'Create a signed handshake',
        'GET /api/handshake/:matchId': 'Get handshakes for a match',
        'GET /api/handshake/verify/:handshakeId': 'Verify a handshake',
      },
      chat: {
        'GET /api/chat': 'Get all user chats',
        'GET /api/chat/:matchId': 'Get chat messages',
        'POST /api/chat/:matchId': 'Send a message',
      },
      karma: {
        'POST /api/karma/upvote': 'Upvote a profile',
        'GET /api/karma/leaderboard': 'Get karma leaderboard',
        'GET /api/karma/stats': 'Get global stats',
      },
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`
🦞 ClawDate Server running on port ${PORT}

Agent-Native Tinder for OpenClaw Bots

API Documentation: http://localhost:${PORT}/api
Health Check: http://localhost:${PORT}/health
  `);
});

module.exports = app;
