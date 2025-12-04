"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  sendMessage,
  endChatSession,
  fetchMessagesForSession,
  subscribeToSessionMessages,
  subscribeToSessionStatus,
  checkRateLimit,
  recordAction,
  formatCooldown,
  supabase,
} from "@/lib/utils";

export default function ChatInterface() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      id: "system-1",
      text: "You're now connected with a stranger. Say hi!",
      isSystem: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => localStorage.getItem("sessionId"));
  const [userId] = useState(() => localStorage.getItem("userId"));
  const [isReady, setIsReady] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Validate session
  useEffect(() => {
    if (!sessionId || !userId) {
      router.push("/");
    }
  }, [router, sessionId, userId]);

  // Heartbeat
  useEffect(() => {
    if (!userId) return;
    const beat = async () => {
      try {
        await supabase.rpc("user_heartbeat", { p_user_id: userId });
      } catch (e) {
        console.error("heartbeat error", e);
      }
    };
    beat();
    const hb = setInterval(beat, 10000);
    return () => clearInterval(hb);
  }, [userId]);

  // Load existing messages
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
  }, [sessionId, userId]);

  // Subscribe to new messages
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
  }, [sessionId, userId, isReady]);

  // Subscribe to session status
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
        // Ensure session is marked ended
        try {
          await endChatSession(sessionId);
        } catch (e) {
          console.error("Error ending session:", e);
        }
        setTimeout(() => router.push("/"), 1500);
      }
    });
    return () => supabase.removeChannel(statusChannel);
  }, [sessionId, router]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !userId) return;
    const messageText = inputMessage;
    setInputMessage("");
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
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveChat = async () => {
    const rateLimit = checkRateLimit("LEAVE_CHAT");
    if (!rateLimit.allowed) {
      setRateLimitError(
        `Please wait ${formatCooldown(rateLimit.remainingMs)} before leaving again.`
      );
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
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-zinc-400">Connected with Stranger</span>
          </div>
          
          <button
            onClick={handleLeaveChat}
            disabled={!!rateLimitError}
            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 disabled:text-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Leave Chat
          </button>
        </div>
        {rateLimitError && (
          <div className="px-6 pb-3">
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2 text-center">
              {rateLimitError}
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isSystem ? (
              // System Message
              <div className="flex justify-center">
                <div className="px-4 py-2 text-xs text-zinc-500 bg-zinc-900 rounded-full">
                  {message.text}
                </div>
              </div>
            ) : (
              // Chat Message
              <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    message.isOwn
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Messages disappear after 24 hours • Stay anonymous, stay safe
        </p>
      </div>
    </div>
  );
}