import { useEffect } from 'react';
import { supabase } from '@/lib/utils';

export function useSessionSubscription(userId, router, setStatus) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`session-listener-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_sessions',
      }, (payload) => {
        const session = payload.new;
        if (session.user1_id === userId || session.user2_id === userId) {
          const partnerId = session.user1_id === userId ? session.user2_id : session.user1_id;
          localStorage.setItem('sessionId', session.id);
          localStorage.setItem('partnerId', partnerId);
          setStatus('Match found! Setting up chat...');
          router.push('/chat');
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, router, setStatus]);
}
