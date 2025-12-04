import { useEffect } from "react";
import { supabase, subscribeToSessionMessages } from "@/lib/utils";

export function useMessageSubscription(sessionId, userId, isReady, setMessages) {
  useEffect(() => {
    if (!sessionId || !userId || !isReady) return;
    const channel = subscribeToSessionMessages(sessionId, (newMessage) => {
      if (newMessage.session_id === sessionId && newMessage.sender_id !== userId) {
        setMessages((prev) => [
          ...prev,
          {
            id: newMessage.id,
            text: newMessage.content,
            isOwn: false,
            timestamp: new Date(newMessage.created_at),
          },
        ]);
      }
    });
    return () => supabase.removeChannel(channel);
  }, [sessionId, userId, isReady, setMessages]);
}
