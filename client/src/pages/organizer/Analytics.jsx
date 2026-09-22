import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrganizerAnalytics } from '../../services/analytics.service';
import AnalyticsCard from '../../components/AnalyticsCard';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

// Reuses the same organizer-wide rollup Dashboard's stat strip is built
// from, plus the per-event breakdown that endpoint already returns — no
// new backend logic, just a dedicated page for the sidebar's Analytics item.
export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetchOrganizerAnalytics()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
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

  if (status === 'loading') return <LoadingState label="Loading analytics…" />;
  if (status === 'error' || !stats) return <ErrorState message="Couldn't load analytics." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">Registration performance across all of your events.</p>
      </PageFade>

      <RevealGroup className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" stagger={0.05}>
        <RevealItem>
          <AnalyticsCard label="Total events" value={stats.totalEvents} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Upcoming events" value={stats.upcomingEventsCount} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Total registrations" value={stats.totalRegistrations} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Waitlisted" value={stats.totalWaitlisted} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Available seats" value={stats.availableSeats} />
        </RevealItem>
        <RevealItem>
          <AnalyticsCard label="Registration rate" value={`${stats.registrationPercentage}%`} />
        </RevealItem>
      </RevealGroup>

      {stats.events.length === 0 ? (
        <EmptyState title="No events yet" description="Create your first event to see registration analytics here." />
      ) : (
        <RevealGroup className="space-y-2.5" stagger={0.04}>
          {stats.events.map((event) => (
            <RevealItem key={event.eventId}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-elevated">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{event.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {event.registeredCount}/{event.capacity} registered
                    {event.waitlistedCount > 0 && ` · ${event.waitlistedCount} waitlisted`} ·{' '}
                    {event.availableSeats} seats available
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <EventStatus status={event.displayStatus} />
                  <Link
                    to={`/organizer/events/${event.eventId}/analytics`}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
