import { Link } from 'react-router-dom';
import EventStatus from './EventStatus';
import TiltCard from './motion/TiltCard';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventCard({ event }) {
  const pct = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const barColor =
    pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-fuchsia-500';

  return (
    <Link to={`/events/${event._id}`} className="block h-full">
      <TiltCard className="group h-full rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-elevated transition-shadow hover:shadow-elevated-lg">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {event.category}
          </span>
          <EventStatus status={event.displayStatus} />
        </div>
        <h3 className="font-display mt-3 text-base font-bold text-neutral-900 transition-colors group-hover:text-brand-700">
          {event.name}
        </h3>
        <p className="mt-1.5 text-sm text-neutral-500">
          {formatDate(event.date)} · {event.startTime}–{event.endTime}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {event.mode === 'online' ? 'Online' : event.location?.address || 'Venue TBA'}
        </p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
          <span>by {event.organizer?.name || 'Unknown organizer'}</span>
          <span>
            {event.registeredCount}/{event.capacity} registered
          </span>
        </div>
      </TiltCard>
    </Link>
  );
}
