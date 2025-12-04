import MessageBubble from "@/components/MessageBubble";

export default function TypingIndicator({ isTyping }) {
  if (!isTyping) return null;

  // Reuse MessageBubble with a "fake" message object
  const typingMessage = {
    id: "typing-indicator",
    text: <Dots />,       // instead of text, render animated dots
    isOwn: false,         // partner bubble style
    isSystem: false,
  };

  return <MessageBubble message={typingMessage} />;
}

// Animated dots component
function Dots() {
  return (
    <div className="flex space-x-1">
      <Dot delay="0ms" />
      <Dot delay="200ms" />
      <Dot delay="400ms" />
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
