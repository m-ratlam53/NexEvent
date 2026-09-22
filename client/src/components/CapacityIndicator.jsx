import { motion } from 'framer-motion';

export default function CapacityIndicator({ registeredCount, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;
  const barColor =
    pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-fuchsia-500';

  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-xs text-neutral-500">
        <span>
          {registeredCount} / {capacity} seats
        </span>
        <span className="font-medium text-neutral-700">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
