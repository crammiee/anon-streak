"use client"

import { useState, useEffect, useRef } from 'react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "You're now connected with a stranger. Say hi!",
        isSystem: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const simulateStrangerResponse = () => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        "Hey! How's it going?",
        "Hi there! 👋",
        "Hello! What brings you here today?",
        "Nice to meet you!",
        "Hey! Tell me something interesting about yourself",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: randomResponse,
          isOwn: false,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      isOwn: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    simulateStrangerResponse();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveChat = () => {
    if (confirm('Are you sure you want to leave this chat?')) {
      alert('Leaving chat... (will navigate to matching page)');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-zinc-400">Connected with Stranger</span>
        </div>
        
        <button
          onClick={handleLeaveChat}
          className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
        >
          Leave Chat
        </button>
      </div>

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

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-4 py-3 bg-zinc-800 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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