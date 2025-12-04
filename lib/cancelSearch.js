import { supabase } from './utils';

export async function cancelSearch(userId) {
  if (!userId) return;
  await supabase.from('waiting_queue').delete().eq('user_id', userId);
}
