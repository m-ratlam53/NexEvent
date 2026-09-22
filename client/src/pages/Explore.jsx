import { useCallback, useEffect, useState } from 'react';
import { fetchEvents, fetchRecommendedEvents } from '../services/events.service';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import EventSearch from '../components/EventSearch';
import EventFilters from '../components/EventFilters';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../components/motion/Reveal';

const DEFAULT_FILTERS = { category: '', date: '', sort: 'date' };

export default function Explore() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  const [recommended, setRecommended] = useState([]);
  const [recommendedStatus, setRecommendedStatus] = useState('idle');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchEvents({ search: search || undefined, ...filters });
      setEvents(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [search, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role !== 'participant') return;
    let cancelled = false;
    setRecommendedStatus('loading');
    fetchRecommendedEvents()
      .then((data) => {
        if (!cancelled) {
          setRecommended(data);
          setRecommendedStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setRecommendedStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Explore Events</h1>
        <p className="mt-1 text-sm text-neutral-500">Find what's happening and reserve your seat.</p>
      </PageFade>

      <div className="mb-8 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EventSearch value={search} onChange={setSearch} />
        <EventFilters filters={filters} onChange={setFilters} />
      </div>

      {!search && user?.role === 'participant' && recommendedStatus === 'ready' && recommended.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-neutral-900">
            <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">✦</span>
            Recommended for you
          </h2>
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((event) => (
              <RevealItem key={event._id}>
                <EventCard event={event} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      )}

      {status === 'loading' && <LoadingState label="Loading events…" />}
      {status === 'error' && <ErrorState message="Couldn't load events. Try again shortly." />}
      {status === 'ready' && events.length === 0 && (
        <EmptyState title="No events match your filters" description="Try a different search or clear filters." />
      )}
      {status === 'ready' && events.length > 0 && (
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <RevealItem key={event._id}>
              <EventCard event={event} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
