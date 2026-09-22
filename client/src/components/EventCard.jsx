import { Link } from 'react-router-dom';
import EventStatus from './EventStatus';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event._id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{event.category}</span>
        <EventStatus status={event.displayStatus} />
      </div>
      <h3 className="mt-2 text-base font-semibold text-neutral-900">{event.name}</h3>
      <p className="mt-1 text-sm text-neutral-500">
        {formatDate(event.date)} · {event.startTime}–{event.endTime}
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        {event.mode === 'online' ? 'Online' : event.location?.address || 'Venue TBA'}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>by {event.organizer?.name || 'Unknown organizer'}</span>
        <span>
          {event.registeredCount}/{event.capacity} registered
        </span>
      </div>
    </Link>
  );
}
