import { useEffect } from "react";
import { supabase } from "@/lib/utils";

export function useHeartbeat(userId) {
  useEffect(() => {
    if (!userId) return;

    const beat = async () => {
      try {
        await supabase.rpc("user_heartbeat", { p_user_id: userId });
      } catch (e) {
        console.error("heartbeat error", e);
      }
    };

    beat(); // run immediately
    const hb = setInterval(beat, 10000);
    return () => clearInterval(hb);
  }, [userId]);
}
