import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import EventForm from '../../features/events/EventForm';
import {
  fetchEventById,
  updateEventRequest,
  publishEventRequest,
  cancelEventRequest,
} from '../../services/events.service';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EventStatus from '../../components/EventStatus';
import PageFade from '../../components/motion/Reveal';
import { BUTTON_PRIMARY, BUTTON_DANGER } from '../../utils/styles';

export default function EditEvent() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [actionError, setActionError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEventById(id)
      .then((data) => {
        if (!cancelled) {
          setEvent(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(values) {
    const updated = await updateEventRequest(id, values);
    setEvent(updated);
    showToast('Changes saved.');
  }

  async function handlePublish() {
    setActionError('');
    try {
      setEvent(await publishEventRequest(id));
      showToast('Event published.');
    } catch (err) {
      const message = err.response?.data?.error || 'Could not publish this event';
      setActionError(message);
      showToast(message, 'error');
    }
  }

  async function handleCancelConfirmed() {
    setConfirmCancelOpen(false);
    setActionError('');
    try {
      setEvent(await cancelEventRequest(id));
      showToast('Event cancelled.');
    } catch (err) {
      const message = err.response?.data?.error || 'Could not cancel this event';
      setActionError(message);
      showToast(message, 'error');
    }
  }

  if (status === 'loading') return <LoadingState label="Loading event…" />;
  if (status === 'error' || !event) return <ErrorState message="Couldn't load this event." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to Dashboard
      </Link>

      <PageFade delay={0.05}>
        <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Edit Event</h1>
              <EventStatus status={event.displayStatus || event.status} />
            </div>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Update event details, timing, venue, or capacity.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {event.status === 'draft' && (
              <button onClick={handlePublish} className={BUTTON_PRIMARY}>
                Publish Event
              </button>
            )}
            {event.status !== 'cancelled' && (
              <button onClick={() => setConfirmCancelOpen(true)} className={BUTTON_DANGER}>
                Cancel event
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-red-500">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{actionError}</span>
          </div>
        )}

        <EventForm
          initialValues={{
            ...event,
            date: event.date?.slice(0, 10),
            endDate: event.endDate?.slice(0, 10),
            registrationDeadline: event.registrationDeadline?.slice(0, 16) || '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
      </PageFade>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancel this event?"
        description="Participants will no longer be able to register. Existing registrations are kept, and the event will show as cancelled."
        confirmLabel="Cancel event"
        danger
        onConfirm={handleCancelConfirmed}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
}
