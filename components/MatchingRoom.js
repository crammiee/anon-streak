"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findMatch, createChatSession, supabase } from '@/lib/utils';

export default function MatchingRoom() {
  const router = useRouter();
  const [dots, setDots] = useState('');
  const [status, setStatus] = useState('Looking for someone to chat with');
  const [searchTime, setSearchTime] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // get userid from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(storedUserId);
  }, [router]);

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Search timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // real matching logic - poll for matches
  useEffect(() => {
    if (!userId) return;

    let isActive = true;

    const attemptMatch = async () => {
      try {
        // Try to find a match
        const match = await findMatch(userId);

        console.log('Match result:', match);

        if (match && isActive) {
          //found a match
          setStatus('Match found! Setting up chat...');

          //create chat session
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const chatSession = await createChatSession(userId, match.user_id);

          //store chat session id in localStorage
          localStorage.setItem('sessionId', chatSession.id);
          localStorage.setItem('partnerId', match.user_id);

          //redirect to chat page
          setTimeout(() => {
            router.push('/chat');
          }, 1000); //poll every second
        }
      } catch (error) {
        console.error('Error finding match', error);
      }
    };
    
    //poll every 5 seconds
    const pollInterval = setInterval(attemptMatch, 5000);
    //initial attempt
    attemptMatch();

    return () => {
      isActive = false;
      clearInterval(pollInterval);
    };
  }, [userId, router]);

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel the search?')) {
      try {
        //remove user from waiting queue
        if (userId) {
          await supabase
            .from('waiting_queue')
            .delete()
            .eq('user_id', userId);
      }

      //redirect to landing page
      router.push('/');
    } catch (error) {
        console.error('Error cancelling search', error);
        router.push('/');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6">
      {/* Animated Circle Loader */}
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div className="w-32 h-32 rounded-full border-4 border-zinc-800 border-t-blue-600 animate-spin"></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full animate-pulse"></div>
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-10 h-10 text-blue-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          {status}
          <span className="inline-block w-8 text-left">{dots}</span>
        </h2>
        <p className="text-zinc-500">
          {searchTime < 60 ? `${searchTime}s` : `${Math.floor(searchTime / 60)}m ${searchTime % 60}s`}
        </p>
      </div>

      {/* Fun Facts / Tips (rotate every 5 seconds) */}
      <div className="max-w-md mb-12">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-400 text-center">
            💡 <span className="font-medium text-zinc-300">Tip:</span> Stay respectful and kind. 
            Everyone here is looking for a genuine connection.
          </p>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        className="px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
      >
        Cancel Search
      </button>

      {/* Stats at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Active chats</span>
        </div>
      </div>
    </div>
  );
}