import { supabase } from './supabase';
export { supabase };

// Create anonymous user
export async function createAnonymousUser() {
  const { data, error } = await supabase
    .from('users')
    .insert([{ is_anonymous: true }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Join waiting queue
export async function joinWaitingQueue(userId) {
  const { data, error } = await supabase
    .from('waiting_queue')
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Find match (get first person in queue who isn't you)
export async function findMatch(currentUserId) {
  const { data, error } = await supabase
    .from('waiting_queue')
    .select('*')
    .neq('user_id', currentUserId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

// Match and create session in a single transactional RPC
// Requires a Postgres function `match_and_create_session(current_user_id uuid)`
// that returns TABLE (session_id uuid, partner_id uuid)
export async function matchAndCreateSession(currentUserId) {
  const { data, error } = await supabase.rpc('match_and_create_session', {
    current_user_id: currentUserId,
  });

  if (error) {
    // If the function is not yet created or other errors occur,
    // fall back to the old findMatch + createChatSession flow.
    console.error('Error in match_and_create_session RPC, falling back:', error);

    const match = await findMatch(currentUserId);
    if (!match) return null;

    const session = await createChatSession(currentUserId, match.user_id);
    return { session_id: session.id, partner_id: match.user_id };
  }

  // RPC returns either null/empty or a single row with session_id & partner_id
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  // Require both session_id and partner_id; otherwise treat as "no match yet"
  if (!row || !row.session_id || !row.partner_id) return null;

  return {
    session_id: row.session_id,
    partner_id: row.partner_id,
  };
}

// Create chat session
export async function createChatSession(user1Id, user2Id) {
  //first check if a session already exists between these users
  const { data: existingSessions } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('status', 'active')
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),
         and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .maybeSingle();
  
  if (existingSessions) {
    console.log('Existing session found between users:', existingSessions.id);
    //remove both from queue
    await supabase.from('waiting_queue').delete().in('user_id', [user1Id, user2Id]);
    return existingSessions;
  }

  console.log('No existing session found, creating new session between users:', user1Id, user2Id);

  //create new session
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ 
      user1_id: user1Id, 
      user2_id: user2Id,
      status: 'active'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }

  console.log('Created new chat session:', data.id);

  // Remove both users from waiting queue
  await supabase.from('waiting_queue').delete().in('user_id', [user1Id, user2Id]);

  return data;
}

// Send message
export async function sendMessage(sessionId, senderId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      session_id: sessionId,
      sender_id: senderId,
      content
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Leave chat session
export async function endChatSession(sessionId) {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}