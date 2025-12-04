export default function TypingIndicator({ isTyping }) {
  if (!isTyping) return null;
  return (
    <div className="flex justify-start px-6 py-2">
      <div className="text-sm text-zinc-400 italic">Stranger is typing…</div>
    </div>
  );
}
