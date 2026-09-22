import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrganizerEvents, publishEventRequest, cancelEventRequest } from '../../services/events.service';
import { fetchOrganizerAnalytics } from '../../services/analytics.service';
import { useToast } from '../../context/ToastContext';
import AnalyticsCard from '../../components/AnalyticsCard';
import EventStatus from '../../components/EventStatus';
import CapacityIndicator from '../../components/CapacityIndicator';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import TiltCard from '../../components/motion/TiltCard';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const ACTION_LINK_CLASS =
  'inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100';

export default function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const load = useCallback(async () => {
    try {
      const [analytics, organizerEvents] = await Promise.all([fetchOrganizerAnalytics(), fetchOrganizerEvents()]);
      setStats(analytics);
      setEvents(organizerEvents);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    setStatus('loading');
    load();
  }, [load]);

  async function handlePublish(id) {
    setActionError('');
    try {
      await publishEventRequest(id);
      showToast('Event published.');
      await load();
    } catch (err) {
      const message = err.response?.data?.error || 'Could not publish event';
      setActionError(message);
      showToast(message, 'error');
    }
  }

  async function confirmCancel() {
    const id = pendingCancelId;
    setPendingCancelId(null);
    setActionError('');
    try {
      await cancelEventRequest(id);
      showToast('Event cancelled.');
      await load();
    } catch (err) {
      const message = err.response?.data?.error || 'Could not cancel event';
      setActionError(message);
      showToast(message, 'error');
    }
  }

  const tabs = useMemo(
    () => ({
      All: events,
      Published: events.filter((e) => e.status === 'published'),
      Draft: events.filter((e) => e.status === 'draft'),
      Completed: events.filter((e) => e.displayStatus === 'Completed'),
      Cancelled: events.filter((e) => e.status === 'cancelled'),
    }),
    [events],
  );
  const visibleEvents = tabs[activeTab] || [];

  if (status === 'loading') return <LoadingState label="Loading dashboard…" />;
  if (status === 'error') return <ErrorState message="Couldn't load your dashboard." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageFade className="mb-6">
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Organizer Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your events and track performance.</p>
      </PageFade>

      <RevealGroup className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" stagger={0.05}>
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

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {actionError}
        </p>
      )}

      {events.length === 0 ? (
        <EmptyState title="No events yet" description="Create your first event to get started." />
      ) : (
        <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {Object.keys(tabs).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {tab}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                }`}
              >
                {tabs[tab].length}
              </span>
            </button>
          ))}
        </div>
      )}

      {events.length > 0 && visibleEvents.length === 0 && (
        <EmptyState title={`No ${activeTab.toLowerCase()} events`} />
      )}

      {visibleEvents.length > 0 && (
        <RevealGroup className="space-y-3" stagger={0.04}>
          {visibleEvents.map((event) => (
            <RevealItem key={event._id}>
              <TiltCard
                tiltStrength={3}
                className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-elevated transition-shadow hover:shadow-elevated-lg dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {event.category}
                      </span>
                      <EventStatus status={event.displayStatus} />
                    </div>
                    <h3 className="font-display mt-2 truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDate(event.date)} · {event.startTime}–{event.endTime}
                      {event.mode === 'online' ? ' · Online' : event.location?.address ? ` · ${event.location.address}` : ''}
                    </p>
                  </div>

                  <div className="w-full max-w-[220px] sm:w-56">
                    <CapacityIndicator registeredCount={event.registeredCount} capacity={event.capacity} />
                    {event.waitlistedCount > 0 && (
                      <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {event.waitlistedCount} waitlisted
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <div className="flex flex-wrap items-center gap-1">
                    <Link to={`/events/${event._id}`} className={ACTION_LINK_CLASS}>
                      View
                    </Link>
                    <Link to={`/organizer/events/${event._id}/edit`} className={ACTION_LINK_CLASS}>
                      Edit
                    </Link>
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(event._id)}
                        className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
                      >
                        Publish
                      </button>
                    )}
                    <Link to={`/organizer/events/${event._id}/participants`} className={ACTION_LINK_CLASS}>
                      Participants
                    </Link>
                  </div>
                  {event.status !== 'cancelled' && (
                    <button
                      onClick={() => setPendingCancelId(event._id)}
                      className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancelId)}
        title="Cancel this event?"
        description="Participants will no longer be able to register. Existing registrations are kept, and the event will show as cancelled."
        confirmLabel="Cancel event"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancelId(null)}
      />
    </div>
  );
}
