export default function CapacityIndicator({ registeredCount, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-neutral-900';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-neutral-500 mb-1">
        <span>
          {registeredCount} / {capacity} seats
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
