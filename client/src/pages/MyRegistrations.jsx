import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRegistrations, cancelRegistrationRequest } from '../services/registrations.service';
import { useToast } from '../context/ToastContext';
import EventStatus from '../components/EventStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../components/motion/Reveal';

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
      const message = err.response?.data?.error || 'Could not cancel registration';
      setError(message);
      showToast(message, 'error');
    }
  }

  if (status === 'loading') return <LoadingState label="Loading your registrations…" />;
  if (status === 'error') return <ErrorState message="Couldn't load your registrations." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900">My Registrations</h1>
        <p className="mt-1 text-sm text-neutral-500">Events you're registered for or waitlisted on.</p>
      </PageFade>

      {error && <p className="mb-4 mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {registrations.length === 0 && (
        <div className="mt-6">
          <EmptyState title="No registrations yet" description="Explore events and register to see them here." />
        </div>
      )}

      {registrations.length > 0 && (
        <RevealGroup className="mt-6 space-y-3" stagger={0.05}>
          {registrations.map((reg) => (
            <RevealItem key={reg._id}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-elevated">
                <Link to={`/events/${reg.event?._id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{reg.event?.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {reg.event ? new Date(reg.event.date).toLocaleDateString() : ''} · by{' '}
                    {reg.event?.organizer?.name}
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
            </RevealItem>
          ))}
        </RevealGroup>
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
