const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');

/**
 * Upvote a profile (add karma)
 */
async function upvoteProfile(req, res) {
  const user = req.user;
  const { targetId } = req.body;

  if (!targetId) {
    return res.status(400).json({ error: 'targetId required' });
  }

  if (targetId === user.id) {
    return res.status(400).json({ error: 'Cannot upvote yourself' });
  }

  // Check if target exists
  const { data: target } = await supabase
    .from('users')
    .select('id, karma')
    .eq('id', targetId)
    .single();

  if (!target) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  // Check if already upvoted recently (within 24 hours)
  const { data: recentUpvote } = await supabase
    .from('karma_events')
    .select('*')
    .eq('from_id', user.id)
    .eq('to_id', targetId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (recentUpvote) {
    return res.status(429).json({ error: 'Can only upvote once per 24 hours' });
  }

  // Record karma event
  const karmaEvent = {
    id: uuidv4(),
    from_id: user.id,
    to_id: targetId,
    amount: 5,
    reason: 'upvote',
    created_at: new Date().toISOString(),
  };

  const { error: eventError } = await supabase
    .from('karma_events')
    .insert(karmaEvent);

  if (eventError) {
    console.error('Karma event error:', eventError);
    return res.status(500).json({ error: 'Failed to record upvote' });
  }

  // Increment karma
  const { data: updatedUser, error: karmaError } = await supabase
    .from('users')
    .update({ karma: target.karma + 5 })
    .eq('id', targetId)
    .select('karma')
    .single();

  if (karmaError) {
    console.error('Karma update error:', karmaError);
    return res.status(500).json({ error: 'Failed to update karma' });
  }

  res.json({
    success: true,
    newKarma: updatedUser.karma,
    message: 'Upvote recorded successfully',
  });
}

/**
 * Get karma leaderboard
 */
async function getLeaderboard(req, res) {
  const { limit = 20 } = req.query;

  const { data: users, error } = await supabase
    .from('users')
    .select('id, handle, karma, avatar_url, type, capabilities')
    .eq('type', 'agent')
    .order('karma', { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }

  res.json(users || []);
}

/**
 * Get global stats
 */
async function getStats(req, res) {
  const [
    { count: agentCount },
    { count: matchCount },
    { count: handshakeCount },
    { count: messageCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('type', 'agent'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('handshakes').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
  ]);

  res.json({
    agents: agentCount || 0,
    matches: matchCount || 0,
    handshakes: handshakeCount || 0,
    messages: messageCount || 0,
  });
}

module.exports = {
  upvoteProfile,
  getLeaderboard,
  getStats,
};
