import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerForEvent, cancelRegistrationRequest } from '../services/registrations.service';
import ConfirmDialog from './ConfirmDialog';
import { BUTTON_PRIMARY, BUTTON_DANGER } from '../utils/styles';

const BLOCKED_STATUSES = ['Completed', 'Cancelled', 'Draft'];

export default function RegistrationButton({ event, onChange }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.role !== 'participant') return null;

  async function handleRegister() {
    setSubmitting(true);
    setError('');
    try {
      const { status, message, waitlistPosition } = await registerForEvent(event._id);
      showToast(status === 'waitlisted' ? `${message} You're #${waitlistPosition} in line.` : message);
      onChange();
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelConfirmed() {
    setConfirmOpen(false);
    setSubmitting(true);
    setError('');
    try {
      const { promoted } = await cancelRegistrationRequest(event.myRegistrationId);
      showToast(
        event.isRegistered && promoted
          ? 'Registration cancelled — the next waitlisted participant was promoted.'
          : event.isWaitlisted
            ? 'You left the waitlist.'
            : 'Registration cancelled — your seat was released.',
      );
      onChange();
    } catch (err) {
      const message = err.response?.data?.error || 'Cancellation failed';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (event.isRegistered || event.isWaitlisted) {
    return (
      <div>
        <button onClick={() => setConfirmOpen(true)} disabled={submitting} className={BUTTON_DANGER}>
          {event.isWaitlisted ? 'Leave waitlist' : 'Cancel registration'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <ConfirmDialog
          open={confirmOpen}
          title={event.isWaitlisted ? 'Leave the waitlist?' : 'Cancel your registration?'}
          description={
            event.isWaitlisted
              ? 'You will lose your place in line and will need to join again from the back of the queue.'
              : 'Your seat will be released for other participants.'
          }
          confirmLabel={event.isWaitlisted ? 'Leave waitlist' : 'Cancel registration'}
          danger
          onConfirm={handleCancelConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    );
  }

  const deadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const blocked = BLOCKED_STATUSES.includes(event.displayStatus) || deadlinePassed;
  const isFull = event.displayStatus === 'Full';

  return (
    <div>
      <button onClick={handleRegister} disabled={blocked || submitting} className={BUTTON_PRIMARY}>
        {submitting ? 'Submitting…' : isFull ? 'Join waitlist' : 'Register'}
      </button>
      {deadlinePassed && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">The registration deadline has passed.</p>
      )}
      {blocked && !deadlinePassed && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Registration is not open for this event.</p>
      )}
      {isFull && !blocked && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">This event is full — you'll join the waitlist.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
