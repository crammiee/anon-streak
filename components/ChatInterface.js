"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useLoadMessages } from "@/hooks/useLoadMessages";
import { useMessageSubscription } from "@/hooks/useMessageSubscription";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { sendMessageWithOptimism } from "@/lib/sendMessageWithOptimism";
import { leaveChat } from "@/lib/leaveChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import TypingIndicator from "@/components/TypingIndicator";

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
  const { partnerTyping, handleTyping } = useTypingIndicator(sessionId, userId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Validate session
  useEffect(() => {
    if (!sessionId || !userId) router.push("/");
  }, [router, sessionId, userId]);

  // Hooks
  useHeartbeat(userId);
  useLoadMessages(sessionId, userId, setMessages, setIsReady);
  useMessageSubscription(sessionId, userId, isReady, setMessages);
  useSessionStatus(sessionId, router, setMessages);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !sessionId || !userId) return;
    sendMessageWithOptimism(sessionId, userId, inputMessage, setMessages);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveChat = () => leaveChat(sessionId, setRateLimitError, router);

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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isSystem ? (
              <div className="flex justify-center">
                <div className="px-4 py-2 text-xs text-zinc-500 bg-zinc-900 rounded-full">
                  {message.text}
                </div>
              </div>
            ) : (
              <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    message.isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <TypingIndicator isTyping={partnerTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => { setInputMessage(e.target.value); handleTyping(e.target.value); }}
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
