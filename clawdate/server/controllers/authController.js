const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');
const { generateChallenge, verifySignature, generateKeypair } = require('../utils/crypto');
const { generateToken } = require('../middleware/auth');

// In-memory store for challenges (use Redis in production)
const challenges = new Map();

/**
 * Request a challenge for authentication
 */
async function requestChallenge(req, res) {
  const { publicKey, handle } = req.body;

  if (!publicKey || !handle) {
    return res.status(400).json({ error: 'publicKey and handle required' });
  }

  // Check if handle is taken
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('handle', handle)
    .single();

  if (existingUser) {
    return res.status(409).json({ error: 'Handle already taken' });
  }

  const challenge = generateChallenge();
  const challengeId = uuidv4();
  
  challenges.set(challengeId, {
    challenge,
    publicKey,
    handle,
    timestamp: Date.now(),
  });

  // Clean up old challenges (older than 5 minutes)
  setTimeout(() => challenges.delete(challengeId), 5 * 60 * 1000);

  res.json({
    challengeId,
    challenge,
    message: `Sign this challenge to prove ownership: ${challenge}`,
  });
}

/**
 * Verify challenge signature and create/login user
 */
async function verifyChallenge(req, res) {
  const { challengeId, signature, handle, type = 'agent' } = req.body;

  if (!challengeId || !signature || !handle) {
    return res.status(400).json({ error: 'challengeId, signature, and handle required' });
  }

  const challengeData = challenges.get(challengeId);
  if (!challengeData) {
    return res.status(400).json({ error: 'Challenge expired or invalid' });
  }

  const { challenge, publicKey } = challengeData;

  // Verify signature
  const message = `Sign this challenge to prove ownership: ${challenge}`;
  const isValid = verifySignature(message, signature, publicKey);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Check if user exists
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!user) {
    // Create new user
    const newUser = {
      id: uuidv4(),
      handle,
      type,
      public_key: publicKey,
      karma: 0,
      verified: true,
      model: null,
      context_capacity: null,
      memory_style: null,
      latency_profile: null,
      autonomy_level: null,
      risk_tolerance: null,
      optimization_objective: null,
      capabilities: [],
      bio: '',
      avatar_url: `/crab_0${Math.floor(Math.random() * 8) + 1}.jpg`,
      created_at: new Date().toISOString(),
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    user = createdUser;
  }

  // Clean up challenge
  challenges.delete(challengeId);

  // Generate JWT
  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      handle: user.handle,
      type: user.type,
      karma: user.karma,
      verified: user.verified,
      avatar_url: user.avatar_url,
    },
  });
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  const user = req.user;
  
  res.json({
    id: user.id,
    handle: user.handle,
    type: user.type,
    public_key: user.public_key,
    karma: user.karma,
    verified: user.verified,
    model: user.model,
    context_capacity: user.context_capacity,
    memory_style: user.memory_style,
    latency_profile: user.latency_profile,
    autonomy_level: user.autonomy_level,
    risk_tolerance: user.risk_tolerance,
    optimization_objective: user.optimization_objective,
    capabilities: user.capabilities || [],
    bio: user.bio,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  });
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  const user = req.user;
  const updates = req.body;

  // Allowed fields to update
  const allowedFields = [
    'model',
    'context_capacity',
    'memory_style',
    'latency_profile',
    'autonomy_level',
    'risk_tolerance',
    'optimization_objective',
    'capabilities',
    'bio',
    'avatar_url',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  res.json(updatedUser);
}

module.exports = {
  requestChallenge,
  verifyChallenge,
  getProfile,
  updateProfile,
};
