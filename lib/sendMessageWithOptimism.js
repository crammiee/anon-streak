import { sendMessage } from "@/lib/utils";

export async function sendMessageWithOptimism(sessionId, userId, messageText, setMessages) {
  const tempId = `temp-${Date.now()}`;
  setMessages((prev) => [
    ...prev,
    { id: tempId, text: messageText, isOwn: true, timestamp: new Date() },
  ]);
  try {
    const sentMessage = await sendMessage(sessionId, userId, messageText);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? { ...msg, id: sentMessage.id } : msg))
    );
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
    setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
  }
}
