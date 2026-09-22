import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerForEvent, cancelRegistrationRequest } from '../services/registrations.service';
import ConfirmDialog from './ConfirmDialog';

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
      setError(err.response?.data?.error || 'Registration failed');
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
      setError(err.response?.data?.error || 'Cancellation failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (event.isRegistered || event.isWaitlisted) {
    return (
      <div>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={submitting}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {event.isWaitlisted ? 'Leave waitlist' : 'Cancel registration'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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

  const blocked = BLOCKED_STATUSES.includes(event.displayStatus);
  const isFull = event.displayStatus === 'Full';

  return (
    <div>
      <button
        onClick={handleRegister}
        disabled={blocked || submitting}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : isFull ? 'Join waitlist' : 'Register'}
      </button>
      {blocked && <p className="mt-2 text-xs text-neutral-500">Registration is not open for this event.</p>}
      {isFull && !blocked && (
        <p className="mt-2 text-xs text-neutral-500">This event is full — you'll join the waitlist.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
