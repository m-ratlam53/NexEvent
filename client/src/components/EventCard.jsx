import { Link } from 'react-router-dom';
import EventStatus from './EventStatus';
import TiltCard from './motion/TiltCard';
import { formatEventDate } from '../utils/eventDateTime';

export default function EventCard({ event, recommended = false, reason }) {
  const pct = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const barColor =
    pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-fuchsia-500';

  return (
    <Link to={`/events/${event._id}`} className="block h-full">
      <TiltCard className="group h-full rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-elevated transition-shadow hover:shadow-elevated-lg dark:border-neutral-800 dark:bg-neutral-900">
        {recommended && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-brand-500">
            ✦ Recommended
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {event.category}
          </span>
          <EventStatus status={event.displayStatus} />
        </div>
        <h3 className="font-display mt-3 text-base font-bold text-neutral-900 transition-colors group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-400">
          {event.name}
        </h3>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {formatEventDate(event)} · {event.startTime}–{event.endTime}
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {event.mode === 'online' ? 'Online' : event.location?.address || 'Venue TBA'}
        </p>
        {recommended && reason && (
          <p className="mt-1.5 text-xs font-medium text-brand-600 dark:text-brand-400">✦ {reason}</p>
        )}

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <span>by {event.organizer?.name || 'Unknown organizer'}</span>
          <span>
            {event.registeredCount}/{event.capacity} registered
          </span>
        </div>
      </TiltCard>
    </Link>
  );
}
