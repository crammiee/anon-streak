import { supabase } from "@/lib/utils";

export async function matchAndCreateSession(userId) {
  try {
    const { data, error } = await supabase.rpc("match_and_create_session", {
      current_user_id: userId,
    });
    if (error) throw error;
    // Depending on your RPC return shape, adjust accordingly
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("Error in matchAndCreateSession:", err);
    return null;
  }
}
