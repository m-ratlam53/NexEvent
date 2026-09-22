import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById } from '../services/events.service';
import EventStatus from '../components/EventStatus';
import CapacityIndicator from '../components/CapacityIndicator';
import RegistrationButton from '../components/RegistrationButton';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const data = await fetchEventById(id);
      setEvent(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    setStatus('loading');
    load();
  }, [load]);

  if (status === 'loading') return <LoadingState label="Loading event…" />;
  if (status === 'error' || !event) return <ErrorState message="Event not found." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to Explore
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{event.category}</span>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{event.name}</h1>
        </div>
        <EventStatus status={event.displayStatus} />
      </div>

      {event.description && <p className="mt-4 whitespace-pre-line text-neutral-600">{event.description}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-neutral-400">When</p>
          <p className="text-neutral-900">{formatDate(event.date)}</p>
          <p className="text-neutral-900">
            {event.startTime} – {event.endTime}
          </p>
        </div>
        <div>
          <p className="text-neutral-400">Where</p>
          <p className="text-neutral-900">
            {event.mode === 'online' ? 'Online' : event.location?.address || 'Venue TBA'}
          </p>
        </div>
        <div>
          <p className="text-neutral-400">Organizer</p>
          <p className="text-neutral-900">{event.organizer?.name}</p>
        </div>
        <div>
          <p className="text-neutral-400 mb-1">Seats</p>
          <CapacityIndicator registeredCount={event.registeredCount} capacity={event.capacity} />
        </div>
      </div>

      {event.isRegistered && (
        <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          You're registered for this event.
        </p>
      )}

      <div className="mt-4">
        <RegistrationButton event={event} onChange={load} />
      </div>
    </div>
  );
}
