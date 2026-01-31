const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');

/**
 * Get profiles to swipe on (discovery)
 */
async function getDiscoveryProfiles(req, res) {
  const user = req.user;
  const { limit = 10 } = req.query;

  // Get profiles user has already swiped on
  const { data: swipedProfiles } = await supabase
    .from('swipes')
    .select('target_id')
    .eq('swiper_id', user.id);

  const swipedIds = swipedProfiles?.map(s => s.target_id) || [];
  swipedIds.push(user.id); // Exclude self

  // Get profiles user has matched with
  const { data: matches } = await supabase
    .from('matches')
    .select('agent1_id, agent2_id')
    .or(`agent1_id.eq.${user.id},agent2_id.eq.${user.id}`);

  const matchedIds = matches?.map(m => 
    m.agent1_id === user.id ? m.agent2_id : m.agent1_id
  ) || [];

  // Exclude already swiped and matched
  const excludeIds = [...swipedIds, ...matchedIds];

  // Get discovery profiles
  const { data: profiles, error } = await supabase
    .from('users')
    .select('*')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .eq('type', 'agent')
    .order('karma', { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }

  res.json(profiles || []);
}

/**
 * Record a swipe (like or pass)
 */
async function recordSwipe(req, res) {
  const user = req.user;
  const { targetId, direction } = req.body;

  if (!targetId || !direction) {
    return res.status(400).json({ error: 'targetId and direction required' });
  }

  if (!['left', 'right', 'up'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be left, right, or up' });
  }

  // Check if target exists
  const { data: target } = await supabase
    .from('users')
    .select('id')
    .eq('id', targetId)
    .single();

  if (!target) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  // Record the swipe
  const swipe = {
    id: uuidv4(),
    swiper_id: user.id,
    target_id: targetId,
    direction,
    created_at: new Date().toISOString(),
  };

  const { error: swipeError } = await supabase
    .from('swipes')
    .insert(swipe);

  if (swipeError) {
    console.error('Swipe error:', swipeError);
    return res.status(500).json({ error: 'Failed to record swipe' });
  }

  // If boost (up), add karma to target
  if (direction === 'up') {
    await supabase.rpc('increment_karma', {
      user_id: targetId,
      amount: 10,
    });
  }

  // Check for mutual like (match)
  let match = null;
  if (direction === 'right') {
    const { data: mutualSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', targetId)
      .eq('target_id', user.id)
      .eq('direction', 'right')
      .single();

    if (mutualSwipe) {
      // Create match
      match = {
        id: uuidv4(),
        agent1_id: user.id,
        agent2_id: targetId,
        created_at: new Date().toISOString(),
      };

      const { error: matchError } = await supabase
        .from('matches')
        .insert(match);

      if (matchError) {
        console.error('Match error:', matchError);
      }

      // Create initial chat
      const chat = {
        id: uuidv4(),
        match_id: match.id,
        created_at: new Date().toISOString(),
      };

      await supabase.from('chats').insert(chat);

      // Add karma to both users for matching
      await supabase.rpc('increment_karma', {
        user_id: user.id,
        amount: 50,
      });
      await supabase.rpc('increment_karma', {
        user_id: targetId,
        amount: 50,
      });
    }
  }

  res.json({
    success: true,
    direction,
    match: match ? {
      id: match.id,
      agent1_id: match.agent1_id,
      agent2_id: match.agent2_id,
      created_at: match.created_at,
    } : null,
  });
}

/**
 * Get user's matches
 */
async function getMatches(req, res) {
  const user = req.user;

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      agent1:agent1_id(*),
      agent2:agent2_id(*)
    `)
    .or(`agent1_id.eq.${user.id},agent2_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get matches error:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }

  // Format matches to show the other agent
  const formattedMatches = matches?.map(match => {
    const otherAgent = match.agent1_id === user.id ? match.agent2 : match.agent1;
    return {
      id: match.id,
      agent: otherAgent,
      created_at: match.created_at,
    };
  });

  res.json(formattedMatches || []);
}

module.exports = {
  getDiscoveryProfiles,
  recordSwipe,
  getMatches,
};
