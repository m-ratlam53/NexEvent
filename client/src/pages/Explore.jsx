import { useEffect, useState } from 'react';
import { fetchEvents } from '../services/events.service';
import EventCard from '../components/EventCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Explore() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      try {
        const data = await fetchEvents();
        if (!cancelled) {
          setEvents(data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Explore Events</h1>

      {status === 'loading' && <LoadingState label="Loading events…" />}
      {status === 'error' && <ErrorState message="Couldn't load events. Try again shortly." />}
      {status === 'ready' && events.length === 0 && (
        <EmptyState title="No events yet" description="Check back soon for upcoming events." />
      )}
      {status === 'ready' && events.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
