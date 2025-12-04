export default function MessageBubble({ message }) {
  if (message.isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 text-xs text-zinc-500 bg-zinc-900 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
          message.isOwn
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
        }`}
      >
        {/* Allow text to be string or React node */}
        {typeof message.text === "string" ? (
          <p className="text-sm leading-relaxed">{message.text}</p>
        ) : (
          message.text
        )}
      </div>
    </div>
  );
}
