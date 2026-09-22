import TiltCard from './motion/TiltCard';

export default function AnalyticsCard({ label, value }) {
  return (
    <TiltCard className="flex h-full flex-col justify-center rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-elevated dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className="font-display mt-1.5 bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-bold text-transparent dark:from-neutral-100 dark:to-neutral-400">
        {value}
      </p>
    </TiltCard>
  );
}
