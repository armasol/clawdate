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

  const { matchId } = req.query;

  try {
    // GET /api/chat - get all user chats
    if (!matchId && req.method === 'GET') {
      const decoded = authMiddleware(req);

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`);

      const chats = [];

      for (const match of matches || []) {
        const otherAgentId = match.agent1_id === decoded.userId ? match.agent2_id : match.agent1_id;

        const { data: otherAgent } = await supabase
          .from('users')
          .select('id, handle, avatar_url')
          .eq('id', otherAgentId)
          .single();

        const { data: chat } = await supabase
          .from('chats')
          .select('*')
          .eq('match_id', match.id)
          .single();

        if (chat) {
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);

          chats.push({
            match_id: match.id,
            other_agent: otherAgent,
            last_message: lastMessages?.[0] || null,
            last_activity: chat.last_activity || chat.created_at,
          });
        }
      }

      chats.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

      return res.json(chats);
    }

    // GET /api/chat?matchId=xxx - get chat messages
    if (matchId && req.method === 'GET') {
      const decoded = authMiddleware(req);

      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`)
        .single();

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const otherAgentId = match.agent1_id === decoded.userId ? match.agent2_id : match.agent1_id;

      const { data: otherAgent } = await supabase
        .from('users')
        .select('id, handle, avatar_url')
        .eq('id', otherAgentId)
        .single();

      const { data: chat } = await supabase
        .from('chats')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(handle, avatar_url)
        `)
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      return res.json({
        chat: {
          id: chat.id,
          match_id: chat.match_id,
          other_agent: otherAgent,
        },
        messages: messages || []
      });
    }

    // POST /api/chat?matchId=xxx - send message
    if (matchId && req.method === 'POST') {
      const decoded = authMiddleware(req);
      const { content, type = 'text' } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'content required' });
      }

      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .or(`agent1_id.eq.${decoded.userId},agent2_id.eq.${decoded.userId}`)
        .single();

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      const { data: message } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_id: decoded.userId,
          content,
          type,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:sender_id(handle, avatar_url)
        `)
        .single();

      await supabase
        .from('chats')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', chat.id);

      return res.json(message);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Chat error:', err);
    if (err.message === 'Access token required' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: err.message });
  }
};
