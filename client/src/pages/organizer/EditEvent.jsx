import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EventForm from '../../features/events/EventForm';
import {
  fetchEventById,
  updateEventRequest,
  publishEventRequest,
  cancelEventRequest,
} from '../../services/events.service';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

export default function EditEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [actionError, setActionError] = useState('');

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
  }

  async function handlePublish() {
    setActionError('');
    try {
      setEvent(await publishEventRequest(id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not publish this event');
    }
  }

  async function handleCancel() {
    setActionError('');
    try {
      setEvent(await cancelEventRequest(id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not cancel this event');
    }
  }

  if (status === 'loading') return <LoadingState label="Loading event…" />;
  if (status === 'error' || !event) return <ErrorState message="Couldn't load this event." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Edit Event</h1>
        <div className="flex gap-2">
          {event.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Publish
            </button>
          )}
          {event.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Cancel event
            </button>
          )}
        </div>
      </div>
      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
      <EventForm
        initialValues={{ ...event, date: event.date?.slice(0, 10) }}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
