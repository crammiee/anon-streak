export default function StatusText({ status, dots, searchTime }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-semibold mb-2">
        {status}
        <span className="inline-block w-8 text-left">{dots}</span>
      </h2>
      <p className="text-zinc-500">
        {searchTime < 60
          ? `${searchTime}s`
          : `${Math.floor(searchTime / 60)}m ${searchTime % 60}s`}
      </p>
    </div>
  );
}
