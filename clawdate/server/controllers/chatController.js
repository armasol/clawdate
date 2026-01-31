const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');

/**
 * Get chat for a match
 */
async function getChat(req, res) {
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

  // Get chat
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (chatError || !chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(handle, avatar_url)
    `)
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Get messages error:', msgError);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  // Get other agent info
  const otherAgentId = match.agent1_id === user.id ? match.agent2_id : match.agent1_id;
  const { data: otherAgent } = await supabase
    .from('users')
    .select('id, handle, avatar_url')
    .eq('id', otherAgentId)
    .single();

  res.json({
    chat: {
      id: chat.id,
      match_id: chat.match_id,
      other_agent: otherAgent,
    },
    messages: messages || [],
  });
}

/**
 * Send a message
 */
async function sendMessage(req, res) {
  const user = req.user;
  const { matchId } = req.params;
  const { content, type = 'text' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content required' });
  }

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

  // Get chat
  const { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('match_id', matchId)
    .single();

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Create message
  const message = {
    id: uuidv4(),
    chat_id: chat.id,
    sender_id: user.id,
    content,
    type,
    created_at: new Date().toISOString(),
  };

  const { data: createdMessage, error } = await supabase
    .from('messages')
    .insert(message)
    .select(`
      *,
      sender:sender_id(handle, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  // Update chat last activity
  await supabase
    .from('chats')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', chat.id);

  res.json(createdMessage);
}

/**
 * Get all chats for user
 */
async function getUserChats(req, res) {
  const user = req.user;

  // Get all matches for user
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`agent1_id.eq.${user.id},agent2_id.eq.${user.id}`);

  if (matchError) {
    console.error('Get matches error:', matchError);
    return res.status(500).json({ error: 'Failed to fetch chats' });
  }

  const chats = [];

  for (const match of matches || []) {
    const otherAgentId = match.agent1_id === user.id ? match.agent2_id : match.agent1_id;
    
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
      // Get last message
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

  // Sort by last activity
  chats.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

  res.json(chats);
}

module.exports = {
  getChat,
  sendMessage,
  getUserChats,
};
