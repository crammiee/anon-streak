import { supabase } from './supabase';

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

// Create chat session
export async function createChatSession(user1Id, user2Id) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ 
      user1_id: user1Id, 
      user2_id: user2Id,
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;

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

// Subscribe to messages
export function subscribeToMessages(sessionId, callback) {
  return supabase
    .channel(`messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
}

// Leave chat session
export async function endChatSession(sessionId) {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}