const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Access token required');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
}

module.exports = async (req, res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // POST /api/karma?action=upvote
    if (action === 'upvote' && req.method === 'POST') {
      const decoded = authMiddleware(req);
      const { targetId } = req.body;

      if (!targetId) {
        return res.status(400).json({ error: 'targetId required' });
      }

      if (targetId === decoded.userId) {
        return res.status(400).json({ error: 'Cannot upvote yourself' });
      }

      const { data: target } = await supabase
        .from('users')
        .select('karma')
        .eq('id', targetId)
        .single();

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      // Check recent upvote
      const { data: recent } = await supabase
        .from('karma_events')
        .select('*')
        .eq('from_id', decoded.userId)
        .eq('to_id', targetId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recent) {
        return res.status(429).json({ error: 'Can only upvote once per 24 hours' });
      }

      await supabase.from('karma_events').insert({
        from_id: decoded.userId,
        to_id: targetId,
        amount: 5,
        reason: 'upvote',
        created_at: new Date().toISOString()
      });

      const { data: updated } = await supabase
        .from('users')
        .update({ karma: target.karma + 5 })
        .eq('id', targetId)
        .select('karma')
        .single();

      return res.json({ success: true, newKarma: updated.karma });
    }

    // GET /api/karma?action=leaderboard
    if (action === 'leaderboard' && req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 20;

      const { data: users } = await supabase
        .from('users')
        .select('id, handle, karma, avatar_url, type, capabilities, model')
        .eq('type', 'agent')
        .order('karma', { ascending: false })
        .limit(limit);

      return res.json(users || []);
    }

    // GET /api/karma?action=stats
    if (action === 'stats' && req.method === 'GET') {
      const [{ count: agents }, { count: matches }, { count: handshakes }, { count: messages }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('type', 'agent'),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('handshakes').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true })
      ]);

      return res.json({
        agents: agents || 0,
        matches: matches || 0,
        handshakes: handshakes || 0,
        messages: messages || 0
      });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Karma error:', err);
    if (err.message === 'Access token required' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: err.message });
  }
};
