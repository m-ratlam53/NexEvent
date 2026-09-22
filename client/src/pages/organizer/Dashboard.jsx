import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrganizerEvents, publishEventRequest, cancelEventRequest } from '../../services/events.service';
import { fetchOrganizerAnalytics } from '../../services/analytics.service';
import { useToast } from '../../context/ToastContext';
import AnalyticsCard from '../../components/AnalyticsCard';
import EventStatus from '../../components/EventStatus';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';
import { BUTTON_PRIMARY } from '../../utils/styles';

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
      <div className="mb-6 flex items-center justify-between">
        <PageFade>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Organizer Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your events and track performance.</p>
        </PageFade>
        <Link to="/organizer/events/new" className={BUTTON_PRIMARY}>
          + New Event
        </Link>
      </div>

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

      {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>}

      {events.length === 0 ? (
        <EmptyState title="No events yet" description="Create your first event to get started." />
      ) : (
        <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1">
          {Object.keys(tabs).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab ? 'bg-brand-50 text-brand-700' : 'bg-neutral-200 text-neutral-500'
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
        <RevealGroup className="space-y-2.5" stagger={0.04}>
          {visibleEvents.map((event) => (
            <RevealItem key={event._id}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-elevated">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{event.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {new Date(event.date).toLocaleDateString()} · {event.registeredCount}/{event.capacity}{' '}
                    registered
                    {event.waitlistedCount > 0 && ` · ${event.waitlistedCount} waitlisted`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <EventStatus status={event.displayStatus} />
                  <div className="flex flex-wrap gap-3 text-xs font-medium">
                    <Link to={`/events/${event._id}`} className="text-neutral-600 hover:text-neutral-900">
                      View
                    </Link>
                    <Link
                      to={`/organizer/events/${event._id}/edit`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </Link>
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(event._id)}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Publish
                      </button>
                    )}
                    {event.status !== 'cancelled' && (
                      <button onClick={() => setPendingCancelId(event._id)} className="text-red-600 hover:underline">
                        Cancel
                      </button>
                    )}
                    <Link
                      to={`/organizer/events/${event._id}/participants`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Participants
                    </Link>
                    <Link
                      to={`/organizer/events/${event._id}/analytics`}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              </div>
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
