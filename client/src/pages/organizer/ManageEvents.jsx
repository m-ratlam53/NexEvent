import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrganizerEvents } from '../../services/events.service';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetchOrganizerEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">My Events</h1>
        <Link
          to="/organizer/events/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + New Event
        </Link>
      </div>

      {status === 'loading' && <LoadingState label="Loading your events…" />}
      {status === 'error' && <ErrorState message="Couldn't load your events." />}
      {status === 'ready' && events.length === 0 && (
        <EmptyState title="No events yet" description="Create your first event to get started." />
      )}
      {status === 'ready' && events.length > 0 && (
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {events.map((event) => (
            <Link
              key={event._id}
              to={`/organizer/events/${event._id}/edit`}
              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{event.name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(event.date).toLocaleDateString()} · {event.registeredCount}/{event.capacity} registered
                </p>
              </div>
              <EventStatus status={event.displayStatus} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
