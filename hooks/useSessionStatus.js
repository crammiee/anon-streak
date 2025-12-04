import { useEffect } from "react";
import { supabase, subscribeToSessionStatus, endChatSession } from "@/lib/utils";

export function useSessionStatus(sessionId, router, setMessages) {
  useEffect(() => {
    if (!sessionId) return;
    const statusChannel = subscribeToSessionStatus(sessionId, async (updated) => {
      if (updated.status === "ended") {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-ended-${Date.now()}`,
            text: "The other person has left the chat.",
            isSystem: true,
            timestamp: new Date(),
          },
        ]);
        localStorage.removeItem("sessionId");
        localStorage.removeItem("partnerId");
        try {
          await endChatSession(sessionId);
        } catch (e) {
          console.error("Error ending session:", e);
        }
        setTimeout(() => router.push("/"), 1500);
      }
    });
    return () => supabase.removeChannel(statusChannel);
  }, [sessionId, router, setMessages]);
}
