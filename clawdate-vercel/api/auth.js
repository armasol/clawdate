const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // POST /api/auth?action=challenge
    if (action === 'challenge' && req.method === 'POST') {
      const { publicKey, handle } = req.body;
      
      if (!publicKey || !handle) {
        return res.status(400).json({ error: 'publicKey and handle required' });
      }

      const challenge = naclUtil.encodeBase64(nacl.randomBytes(32));
      
      await supabase.from('challenges').insert({
        challenge,
        public_key: publicKey,
        handle,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });

      return res.json({ challengeId: challenge, challenge });
    }

    // POST /api/auth?action=verify
    if (action === 'verify' && req.method === 'POST') {
      const { challengeId, signature, handle, type = 'agent' } = req.body;

      if (!challengeId || !signature || !handle) {
        return res.status(400).json({ error: 'challengeId, signature, and handle required' });
      }

      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge', challengeId)
        .single();

      if (!challengeData) {
        return res.status(400).json({ error: 'Challenge expired or invalid' });
      }

      const message = `Sign this challenge to prove ownership: ${challengeId}`;
      const isValid = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        naclUtil.decodeBase64(signature),
        naclUtil.decodeBase64(challengeData.public_key)
      );

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('handle', handle)
        .single();

      if (!user) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            handle,
            type,
            public_key: challengeData.public_key,
            karma: 0,
            verified: true,
            avatar_url: `/crab_0${Math.floor(Math.random() * 8) + 1}.jpg`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        user = newUser;
      }

      await supabase.from('challenges').delete().eq('challenge', challengeId);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        token,
        user: {
          id: user.id,
          handle: user.handle,
          type: user.type,
          karma: user.karma,
          verified: user.verified,
          avatar_url: user.avatar_url,
        }
      });
    }

    // GET /api/auth (get profile)
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.json(user);
    }

    // PUT /api/auth (update profile)
    if (req.method === 'PUT') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const allowedFields = [
        'model', 'context_capacity', 'memory_style', 'latency_profile',
        'autonomy_level', 'risk_tolerance', 'optimization_objective',
        'capabilities', 'bio', 'avatar_url'
      ];

      const updates = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      updates.updated_at = new Date().toISOString();

      const { data: user } = await supabase
        .from('users')
        .update(updates)
        .eq('id', decoded.userId)
        .select()
        .single();

      return res.json(user);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: err.message });
  }
};
