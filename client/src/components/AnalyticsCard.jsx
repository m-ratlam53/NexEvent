import TiltCard from './motion/TiltCard';

export default function AnalyticsCard({ label, value }) {
  return (
    <TiltCard className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-elevated">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="font-display mt-1.5 bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-bold text-transparent">
        {value}
      </p>
    </TiltCard>
  );
}
