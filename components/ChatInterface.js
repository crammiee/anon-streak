"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage, endChatSession, supabase } from '@/lib/utils';

export default function ChatInterface() {
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const messagesEndRef = useRef(null);

  //auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  //get sessionId and userId from localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUserId = localStorage.getItem('userId');
    const storedPartnerId = localStorage.getItem('partnerId');

    console.log('Retrieved from localStorage:', {
      sessionId: storedSessionId,
      userId: storedUserId,
      partnerId: storedPartnerId,
    });

    if (!storedSessionId || !storedUserId) {
      // no session, redirect to home
      console.log('Missing sessionId or userId in localStorage, redirecting to home.');
      router.push('/');
      return;
    }

    setSessionId(storedSessionId);
    setUserId(storedUserId);
    setPartnerId(storedPartnerId);

    // add system message
    setMessages([
      {
        id: 'system-1',
        text: "You're now connected with a stranger. Say hi!",
        isSystem: true,
        timestamp: new Date(),
      }
    ]);
  }, [router]);

  // load existing messages from database
  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      try {
        console.log('Loading existing messages for session:', sessionId);

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        console.log('Loaded messages data:', data);
        console.log('Loaded messages error:', error);
        
        if (error) throw error;

        if (data && data.length > 0) {
          console.log('found data length:', data.length);

          const formattedMessages = data.map(msg => ({
            id: msg.id,
            text: msg.content,
            isOwn: msg.sender_id === userId,
            timestamp: new Date(msg.created_at),
          }));

          setMessages(prev => {
            //keep system messages at the top
            const systemMessages = prev.filter(m => m.isSystem);
            return [...systemMessages, ...formattedMessages];
          });
        }
        
        //mark as ready after messages are loaded
        console.log('messages are loaded');
        setIsReady(true);

      } catch (error) {
        console.error('Error loading messages:', error);
        setIsReady(true); //even on error, mark as ready to allow sending
      }
    };

    loadMessages();
  }, [sessionId, userId]);

  //subscribe to new messages (real-time) - simplified ver
  useEffect(() => {
    if (!sessionId || !userId) {
      console.log('Missing sessionId or userId, cannot subscribe to messages.');
      return;
    }

    console.log('Setting up message subscription for session:', sessionId);
    console.log('Current userId:', userId);

    const channel = supabase
      .channel(`realtime-messages-${sessionId}`) //unique channel per session
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Received new message payload:', payload);

          const newMessage = payload.new;

          console.log('Checking if message is for us:', {
            messageSession: newMessage.session_id,
            currentSession: sessionId,
            isMatch: newMessage.session_id === sessionId,
            messageSender: newMessage.sender_id,
            ourUserId: userId,
            isFromPartner: newMessage.sender_id !== userId,
          });

          //only add message if it's for this session and not from self
          if (newMessage.session_id === sessionId && newMessage.sender_id !== userId) {
            console.log('Adding new message from partner:', newMessage);

            setMessages(prev => [
              ...prev,
              {
                id: newMessage.id,
                text: newMessage.content,
                isOwn: false,
                timestamp: new Date(newMessage.created_at),
              }
            ]);
          } else {
            console.log('Ignoring message not for us or from self:', newMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for session ${sessionId}:`, status);
      });

    return () => {
      console.log('Unsubscribing from messages for session:', sessionId);
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, isReady]); //depend on isReady to ensure sessionId and userId are set

  // listen for session end (partner leaving chat)
  useEffect(() => {
    if (!sessionId) {
      console.log('Missing sessionId, cannot subscribe to session status.');
      return;
    }

    console.log('Setting up session status subscription for session:', sessionId);

    const statusChannel = supabase
      .channel(`realtime-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new;
          console.log('Received session update payload:', updated);

          if (updated.status === 'ended') {
            console.log('Session ended, notifying user and returning to landing.');

            setMessages(prev => [
              ...prev,
              {
                id: `system-ended-${Date.now()}`,
                text: 'The other person has left the chat.',
                isSystem: true,
                timestamp: new Date(),
              },
            ]);

            // Clear session data and redirect after a short delay
            localStorage.removeItem('sessionId');
            localStorage.removeItem('partnerId');

            setTimeout(() => {
              router.push('/');
            }, 1500);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Session status subscription for ${sessionId}:`, status);
      });

    return () => {
      console.log('Unsubscribing from session status for session:', sessionId);
      supabase.removeChannel(statusChannel);
    };
  }, [sessionId, router]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !userId) return;

    const messageText = inputMessage;
    setInputMessage('');

    //optimistic add message to ui
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      isOwn: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      //send message to backend
      const sentMessage = await sendMessage(sessionId, userId, messageText)

      //replace optimistic message id with real id
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
          ? { ...msg, id: sentMessage.id }
          : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.'); 

      //remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveChat = async () => {
    if (confirm('Are you sure you want to leave this chat?')) {
      try {
        if (sessionId) {
          await endChatSession(sessionId);
        }

        //clear session data
        localStorage.removeItem('sessionId');
        localStorage.removeItem('partnerId');

        //navigate to landing
        router.push('/');
      } catch (error) {
        console.error('Error leaving chat session:', error);
        router.push('/');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
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