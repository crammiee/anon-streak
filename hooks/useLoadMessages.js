import { useEffect } from "react";
import { fetchMessagesForSession } from "@/lib/utils";

export function useLoadMessages(sessionId, userId, setMessages, setIsReady) {
  useEffect(() => {
    if (!sessionId || !userId) return;
    const loadMessages = async () => {
      try {
        const data = await fetchMessagesForSession(sessionId);
        if (data?.length) {
          const formatted = data.map((msg) => ({
            id: msg.id,
            text: msg.content,
            isOwn: msg.sender_id === userId,
            timestamp: new Date(msg.created_at),
          }));
          setMessages((prev) => {
            const systemMessages = prev.filter((m) => m.isSystem);
            return [...systemMessages, ...formatted];
          });
        }
        setIsReady(true);
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsReady(true);
      }
    };
    loadMessages();
  }, [sessionId, userId, setMessages, setIsReady]);
}
