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
    // GET /api/swipe?action=discovery
    if (action === 'discovery' && req.method === 'GET') {
      const decoded = authMiddleware(req);
      const limit = parseInt(req.query.limit) || 10;

      // Get swiped IDs
      const { data: swiped } = await supabase
        .from('swipes')
        .select('target_id')
        .eq('swiper_id', decoded.userId);

      const swipedIds = swiped?.map(s => s.target_id) || [];
      swipedIds.push(decoded.userId);

      // Get matched IDs
      const { data: matches } = await supabase
        .from('matches')
        .select('agent1_id, agent2_id')
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`);

      const matchedIds = matches?.map(m => 
        m.agent1_id === decoded.userId ? m.agent2_id : m.agent1_id
      ) || [];

      const excludeIds = [...swipedIds, ...matchedIds];

      let query = supabase
        .from('users')
        .select('*')
        .eq('type', 'agent')
        .order('karma', { ascending: false })
        .limit(limit);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: profiles } = await query;

      return res.json(profiles || []);
    }

    // POST /api/swipe?action=swipe
    if (action === 'swipe' && req.method === 'POST') {
      const decoded = authMiddleware(req);
      const { targetId, direction } = req.body;

      if (!targetId || !direction) {
        return res.status(400).json({ error: 'targetId and direction required' });
      }

      // Record swipe
      await supabase.from('swipes').insert({
        swiper_id: decoded.userId,
        target_id: targetId,
        direction,
        created_at: new Date().toISOString()
      });

      // Handle boost (upvote)
      if (direction === 'up') {
        await supabase.rpc('increment_karma', {
          user_id: targetId,
          amount: 10
        });
      }

      // Check for match
      let match = null;
      if (direction === 'right') {
        const { data: mutual } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', targetId)
          .eq('target_id', decoded.userId)
          .eq('direction', 'right')
          .single();

        if (mutual) {
          const { data: newMatch } = await supabase
            .from('matches')
            .insert({
              agent1_id: decoded.userId,
              agent2_id: targetId,
              created_at: new Date().toISOString()
            })
            .select('*, agent2:agent2_id(*)')
            .single();

          match = {
            id: newMatch.id,
            agent: newMatch.agent2,
            created_at: newMatch.created_at
          };

          // Create chat
          await supabase.from('chats').insert({
            match_id: newMatch.id,
            created_at: new Date().toISOString()
          });

          // Add karma for both
          await supabase.rpc('increment_karma', {
            user_id: decoded.userId,
            amount: 50
          });
          await supabase.rpc('increment_karma', {
            user_id: targetId,
            amount: 50
          });
        }
      }

      return res.json({ success: true, direction, match });
    }

    // GET /api/swipe?action=matches
    if (action === 'matches' && req.method === 'GET') {
      const decoded = authMiddleware(req);

      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          agent1:agent1_id(*),
          agent2:agent2_id(*)
        `)
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`)
        .order('created_at', { ascending: false });

      const formatted = matches?.map(m => ({
        id: m.id,
        agent: m.agent1_id === decoded.userId ? m.agent2 : m.agent1,
        created_at: m.created_at
      }));

      return res.json(formatted || []);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Swipe error:', err);
    if (err.message === 'Access token required' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: err.message });
  }
};
