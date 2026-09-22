import { useCallback, useEffect, useState } from 'react';
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

export default function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [actionError, setActionError] = useState('');

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
      setActionError(err.response?.data?.error || 'Could not publish event');
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
      setActionError(err.response?.data?.error || 'Could not cancel event');
    }
  }

  if (status === 'loading') return <LoadingState label="Loading dashboard…" />;
  if (status === 'error') return <ErrorState message="Couldn't load your dashboard." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Organizer Dashboard</h1>
        <Link
          to="/organizer/events/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + New Event
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <AnalyticsCard label="Total events" value={stats.totalEvents} />
        <AnalyticsCard label="Upcoming events" value={stats.upcomingEventsCount} />
        <AnalyticsCard label="Total registrations" value={stats.totalRegistrations} />
        <AnalyticsCard label="Waitlisted" value={stats.totalWaitlisted} />
        <AnalyticsCard label="Available seats" value={stats.availableSeats} />
        <AnalyticsCard label="Registration rate" value={`${stats.registrationPercentage}%`} />
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

      {events.length === 0 && (
        <EmptyState title="No events yet" description="Create your first event to get started." />
      )}

      {events.length > 0 && (
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {events.map((event) => (
            <div key={event._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{event.name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(event.date).toLocaleDateString()} · {event.registeredCount}/{event.capacity} registered
                  {event.waitlistedCount > 0 && ` · ${event.waitlistedCount} waitlisted`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <EventStatus status={event.displayStatus} />
                <div className="flex flex-wrap gap-3 text-xs font-medium">
                  <Link to={`/events/${event._id}`} className="text-neutral-600 hover:text-neutral-900">
                    View
                  </Link>
                  <Link to={`/organizer/events/${event._id}/edit`} className="text-neutral-600 hover:text-neutral-900">
                    Edit
                  </Link>
                  {event.status === 'draft' && (
                    <button onClick={() => handlePublish(event._id)} className="text-neutral-600 hover:text-neutral-900">
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
                  <Link to={`/organizer/events/${event._id}/analytics`} className="text-neutral-600 hover:text-neutral-900">
                    Analytics
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
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
