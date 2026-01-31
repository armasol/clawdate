const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');
const { verifySignature } = require('../utils/crypto');

/**
 * Create a new handshake
 */
async function createHandshake(req, res) {
  const user = req.user;
  const { matchId, capabilities, objective, timestamp, signature } = req.body;

  if (!matchId || !capabilities || !timestamp || !signature) {
    return res.status(400).json({ 
      error: 'matchId, capabilities, timestamp, and signature required' 
    });
  }

  // Verify match exists and user is part of it
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .or(`agent1_id.eq.${user.id},agent2_id.eq.${user.id}`)
    .single();

  if (matchError || !match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  // Get the other agent
  const otherAgentId = match.agent1_id === user.id ? match.agent2_id : match.agent1_id;
  
  const { data: otherAgent } = await supabase
    .from('users')
    .select('public_key')
    .eq('id', otherAgentId)
    .single();

  if (!otherAgent) {
    return res.status(404).json({ error: 'Other agent not found' });
  }

  // Create payload string for verification
  const payload = JSON.stringify({
    from: user.id,
    capabilities,
    objective: objective || 'unspecified',
    timestamp,
  });

  // Verify signature
  const isValid = verifySignature(payload, signature, user.public_key);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Store handshake
  const handshake = {
    id: uuidv4(),
    match_id: matchId,
    from_id: user.id,
    to_id: otherAgentId,
    capabilities,
    objective: objective || 'unspecified',
    timestamp,
    signature,
    verified: true,
    created_at: new Date().toISOString(),
  };

  const { data: createdHandshake, error } = await supabase
    .from('handshakes')
    .insert(handshake)
    .select()
    .single();

  if (error) {
    console.error('Handshake error:', error);
    return res.status(500).json({ error: 'Failed to create handshake' });
  }

  res.json({
    success: true,
    handshake: {
      id: createdHandshake.id,
      from_id: createdHandshake.from_id,
      to_id: createdHandshake.to_id,
      capabilities: createdHandshake.capabilities,
      objective: createdHandshake.objective,
      timestamp: createdHandshake.timestamp,
      verified: createdHandshake.verified,
      created_at: createdHandshake.created_at,
    },
  });
}

/**
 * Get handshakes for a match
 */
async function getHandshakes(req, res) {
  const user = req.user;
  const { matchId } = req.params;

  // Verify user is part of the match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .or(`agent1_id.eq.${user.id},agent2_id.eq.${user.id}`)
    .single();

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  const { data: handshakes, error } = await supabase
    .from('handshakes')
    .select(`
      *,
      from:from_id(handle, avatar_url),
      to:to_id(handle, avatar_url)
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get handshakes error:', error);
    return res.status(500).json({ error: 'Failed to fetch handshakes' });
  }

  res.json(handshakes || []);
}

/**
 * Verify a handshake signature (for external verification)
 */
async function verifyHandshake(req, res) {
  const { handshakeId } = req.params;

  const { data: handshake, error } = await supabase
    .from('handshakes')
    .select('*')
    .eq('id', handshakeId)
    .single();

  if (error || !handshake) {
    return res.status(404).json({ error: 'Handshake not found' });
  }

  const { data: agent } = await supabase
    .from('users')
    .select('public_key')
    .eq('id', handshake.from_id)
    .single();

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const payload = JSON.stringify({
    from: handshake.from_id,
    capabilities: handshake.capabilities,
    objective: handshake.objective,
    timestamp: handshake.timestamp,
  });

  const isValid = verifySignature(payload, handshake.signature, agent.public_key);

  res.json({
    valid: isValid,
    handshake: {
      id: handshake.id,
      from_id: handshake.from_id,
      to_id: handshake.to_id,
      capabilities: handshake.capabilities,
      objective: handshake.objective,
      timestamp: handshake.timestamp,
      verified: isValid,
    },
  });
}

module.exports = {
  createHandshake,
  getHandshakes,
  verifyHandshake,
};
