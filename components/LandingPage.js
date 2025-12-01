"use client"

import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();

    const handleStartChatting = () => {
        router.push("/matching");
    };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6">
      {/* Logo/Brand */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <svg 
              className="w-7 h-7 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AnonStreak
          </h1>
        </div>
        
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Connect anonymously with strangers. Build streaks. Stay private.
        </p>
      </div>

      {/* Main CTA */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={handleStartChatting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
        >
          Start Chatting Anonymously
        </button>

        <div className="text-center text-sm text-zinc-500">
          No signup required • Completely anonymous
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">100% Anonymous</h3>
          <p className="text-sm text-zinc-500">No personal info required. Chat freely without revealing your identity.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Instant Matching</h3>
          <p className="text-sm text-zinc-500">Get connected with someone new in seconds. No waiting around.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Ephemeral Messages</h3>
          <p className="text-sm text-zinc-500">Messages auto-delete after 24 hours. Nothing is permanent.</p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-16 text-center">
        <p className="text-xs text-zinc-600">
          By using AnonStreak, you agree to stay respectful and follow community guidelines.
        </p>
      </div>
    </div>
  );
}