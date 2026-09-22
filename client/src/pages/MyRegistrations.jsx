import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRegistrations, cancelRegistrationRequest } from '../services/registrations.service';
import { useToast } from '../context/ToastContext';
import EventStatus from '../components/EventStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function MyRegistrations() {
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchMyRegistrations();
      setRegistrations(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    setStatus('loading');
    load();
  }, [load]);

  async function confirmCancel() {
    const id = pendingCancelId;
    setPendingCancelId(null);
    setError('');
    try {
      await cancelRegistrationRequest(id);
      showToast('Registration cancelled — your seat was released.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel registration');
    }
  }

  if (status === 'loading') return <LoadingState label="Loading your registrations…" />;
  if (status === 'error') return <ErrorState message="Couldn't load your registrations." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">My Registrations</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {registrations.length === 0 && (
        <EmptyState title="No registrations yet" description="Explore events and register to see them here." />
      )}

      {registrations.length > 0 && (
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {registrations.map((reg) => (
            <div key={reg._id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link to={`/events/${reg.event?._id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{reg.event?.name}</p>
                <p className="text-xs text-neutral-500">
                  {reg.event ? new Date(reg.event.date).toLocaleDateString() : ''} · by {reg.event?.organizer?.name}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <EventStatus
                  status={
                    reg.status === 'cancelled'
                      ? 'Cancelled'
                      : reg.status === 'waitlisted'
                        ? `Waitlisted · #${reg.waitlistPosition}`
                        : 'Registered'
                  }
                />
                {(reg.status === 'registered' || reg.status === 'waitlisted') && (
                  <button
                    onClick={() => setPendingCancelId(reg._id)}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    {reg.status === 'waitlisted' ? 'Leave waitlist' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancelId)}
        title="Cancel your registration?"
        description="Your seat will be released for other participants."
        confirmLabel="Cancel registration"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancelId(null)}
      />
    </div>
  );
}
