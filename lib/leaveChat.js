import { endChatSession, checkRateLimit, recordAction, formatCooldown } from "@/lib/utils";

export async function leaveChat(sessionId, setRateLimitError, router) {
  const rateLimit = checkRateLimit("LEAVE_CHAT");
  if (!rateLimit.allowed) {
    setRateLimitError(`Please wait ${formatCooldown(rateLimit.remainingMs)} before leaving again.`);
    setTimeout(() => setRateLimitError(null), rateLimit.remainingMs);
    return;
  }
  if (confirm("Are you sure you want to leave this chat?")) {
    try {
      if (sessionId) await endChatSession(sessionId);
      recordAction("LEAVE_CHAT");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("partnerId");
      router.push("/");
    } catch (error) {
      console.error("Error leaving chat:", error);
      router.push("/");
    }
  }
}
