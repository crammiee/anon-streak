import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/utils";

export function useTypingIndicator(sessionId, userId) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef(null);
  const timeoutRef = useRef(null);

  // Subscribe to typing broadcasts
  useEffect(() => {
    if (!sessionId || !userId) return;

    const channel = supabase.channel(`typing-${sessionId}`);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {

        //debug logging
        console.log("Received typing event:", payload);

        if (payload.user_id !== userId) {
          setPartnerTyping(payload.isTyping);
        }
      });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [sessionId, userId]);

  // Send typing events
  const sendTyping = (isTyping) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId, isTyping },
    });
  };

  // Handle input changes with debounce
  const handleTyping = () => {
    sendTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => sendTyping(false), 1000);
  };

  return { partnerTyping, handleTyping };
}
