import { useNavigate } from 'react-router-dom';
import EventForm from '../../features/events/EventForm';
import { createEventRequest } from '../../services/events.service';

export default function CreateEvent() {
  const navigate = useNavigate();

  async function handleSubmit(values) {
    const event = await createEventRequest(values);
    navigate(`/organizer/events/${event._id}/edit`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Create Event</h1>
      <EventForm onSubmit={handleSubmit} submitLabel="Create draft" />
    </div>
  );
}
