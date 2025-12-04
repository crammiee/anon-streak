export default function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
      <div className={`w-12 h-12 ${color}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}
