import { useNavigate, Link } from 'react-router-dom';
import EventForm from '../../features/events/EventForm';
import { createEventRequest } from '../../services/events.service';
import { useToast } from '../../context/ToastContext';
import PageFade from '../../components/motion/Reveal';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSubmit(values) {
    const event = await createEventRequest(values);
    showToast('Draft created.');
    navigate(`/organizer/events/${event._id}/edit`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
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
        <div className="mb-8 mt-3">
          <h1 className="font-display text-3xl font-bold text-neutral-900">Create Event</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Fill in event details to save a new draft. You can review and publish whenever you're ready.
          </p>
        </div>
        <EventForm onSubmit={handleSubmit} submitLabel="Create draft" />
      </PageFade>
    </div>
  );
}
