import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRegistrations, cancelRegistrationRequest } from '../services/registrations.service';
import { useToast } from '../context/ToastContext';
import EventStatus from '../components/EventStatus';
import CapacityIndicator from '../components/CapacityIndicator';
import EventDetailRow, { SEATS_ICON } from '../components/EventDetailRow';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { eventEndDate } from '../utils/eventDateTime';

const ACTION_LINK_CLASS =
  'inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100';

function isEventPast(event) {
  if (!event) return false;
  const end = new Date(eventEndDate(event));
  const [hours, minutes] = (event.endTime || '23:59').split(':').map(Number);
  end.setHours(hours, minutes, 0, 0);
  return new Date() > end;
}

export default function MyRegistrations() {
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Upcoming');

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

  const tabs = useMemo(() => {
    const active = registrations.filter((r) => r.status !== 'cancelled');
    return {
      Upcoming: active.filter((r) => !isEventPast(r.event)),
      Waitlisted: registrations.filter((r) => r.status === 'waitlisted'),
      Past: active.filter((r) => isEventPast(r.event)),
      Cancelled: registrations.filter((r) => r.status === 'cancelled'),
    };
  }, [registrations]);

  const visible = tabs[activeTab] || [];

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
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">My Registrations</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Events you're registered for or waitlisted on.</p>
      </PageFade>

      <div className="mb-6 mt-6 flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
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

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
      )}

      {visible.length === 0 && (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} registrations`}
          description="Explore events and register to see them here."
        />
      )}

      {visible.length > 0 && (
        <RevealGroup className="space-y-3" stagger={0.05}>
          {visible.map((reg) => (
            <RevealItem key={reg._id}>
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-elevated dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {reg.event?.category && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {reg.event.category}
                      </span>
                    )}
                    <EventStatus
                      status={
                        reg.status === 'cancelled'
                          ? 'Cancelled'
                          : reg.status === 'waitlisted'
                            ? `Waitlisted · #${reg.waitlistPosition}`
                            : 'Registered'
                      }
                    />
                  </div>
                  {reg.event && (
                    <div className="w-full max-w-[220px] sm:w-56">
                      <CapacityIndicator
                        registeredCount={reg.event.registeredCount}
                        capacity={reg.event.capacity}
                        icon={SEATS_ICON}
                      />
                    </div>
                  )}
                </div>

                <h3 className="font-display mt-3 truncate text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {reg.event?.name}
                </h3>
                {reg.event?.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {reg.event.description}
                  </p>
                )}

                {reg.event && (
                  <div className="mt-4">
                    <EventDetailRow event={reg.event} />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <Link to={`/events/${reg.event?._id}`} className={ACTION_LINK_CLASS}>
                    View
                  </Link>
                  {(reg.status === 'registered' || reg.status === 'waitlisted') && (
                    <button
                      onClick={() => setPendingCancelId(reg._id)}
                      className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
