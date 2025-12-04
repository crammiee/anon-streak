export default function CTAButton({ onClick, isLoading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
    >
      {isLoading ? "Connecting..." : "Start Chatting Anonymously"}
    </button>
  );
}
