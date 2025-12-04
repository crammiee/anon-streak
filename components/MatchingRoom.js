"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/utils";
import { matchAndCreateSession } from "@/lib/matchAndCreateSession";
import Loader from "@/components/Loader";
import StatusText from "@/components/StatusText";
import TipsBox from "@/components/TipsBox";

const searchPhrases = [
  "Searching for a friendly stranger",
  "Connecting you with someone new",
  "Finding the perfect chat partner",
  "Looking for a fellow anonymous chatter",
  "Matching you with a random user",
];

const matchedPhrases = [
  "Match found! Setting up chat",
  "It's a match! You're about to meet someone new",
  "Found a match! Get ready to chat with a stranger",
  "Connection established! Preparing chat",
  "Yeah! A new chat partner is on the way",
];

export default function MatchingRoom() {
  const router = useRouter();
  const [dots, setDots] = useState("");
  const [searchTime, setSearchTime] = useState(0);
  const [userId, setUserId] = useState(null);
  
  //helper to pick random phrase
  const getRandomPhrase = (phrases) =>
    phrases[Math.floor(Math.random() * phrases.length)];
  
  const [status, setStatus] = useState(() => getRandomPhrase(searchPhrases));

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(storedUserId);
  }, [router]);

  // One-time RPC attempt
  useEffect(() => {
    if (!userId) return;
    const attemptMatch = async () => {
      const result = await matchAndCreateSession(userId);
      if (result) {
        const partnerId = result.partner_id;
        localStorage.setItem("sessionId", result.session_id);
        localStorage.setItem("partnerId", partnerId);

        //show feedback first
        setStatus(getRandomPhrase(matchedPhrases));
        setTimeout(() => {
          router.push("/chat");
        }, 2000);
      }
    };
    attemptMatch();
  }, [userId, router]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Search timer
  useEffect(() => {
    const timer = setInterval(() => setSearchTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`session-listener-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_sessions",
      }, (payload) => {
        const session = payload.new;
        if (session.user1_id === userId || session.user2_id === userId) {
          const partnerId =
            session.user1_id === userId ? session.user2_id : session.user1_id;
          localStorage.setItem("sessionId", session.id);
          localStorage.setItem("partnerId", partnerId);

          //show feedback first
          setStatus(getRandomPhrase(matchedPhrases));
          setTimeout(() => {
            router.push("/chat");
          }, 2000);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6">
      <Loader />
      <StatusText status={status} dots={dots} searchTime={searchTime} />
      <TipsBox />
      <button
        onClick={async () => {
          if (userId) {
            await supabase.from("waiting_queue").delete().eq("user_id", userId);
          }
          router.push("/");
        }}
        className="px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
      >
        Cancel Search
      </button>
    </div>
  );
}
