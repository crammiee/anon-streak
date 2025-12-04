import { useEffect } from 'react';
import { supabase } from '@/lib/utils';

export function useSessionCheck(userId, router) {
  useEffect(() => {
    if (!userId) return;
    const checkExisting = async () => {
      const { data: activeSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'active')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle();
      if (activeSession) {
        const partnerId = activeSession.user1_id === userId ? activeSession.user2_id : activeSession.user1_id;
        localStorage.setItem('sessionId', activeSession.id);
        localStorage.setItem('partnerId', partnerId);
        router.push('/chat');
      }
    };
    checkExisting();
  }, [userId, router]);
}
