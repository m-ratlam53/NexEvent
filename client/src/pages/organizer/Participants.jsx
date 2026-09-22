import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById, fetchEventRegistrations } from '../../services/events.service';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

export default function Participants() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchEventById(id), fetchEventRegistrations(id)])
      .then(([eventData, regs]) => {
        if (!cancelled) {
          setEvent(eventData);
          setRegistrations(regs);
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

  if (status === 'loading') return <LoadingState label="Loading participants…" />;
  if (status === 'error' || !event) return <ErrorState message="Couldn't load participants." />;

  const activeCount = registrations.filter((r) => r.status === 'registered').length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/organizer/events" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-semibold text-neutral-900">{event.name} — Participants</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {activeCount} active of {event.capacity} seats
      </p>

      {registrations.length === 0 && <EmptyState title="No registrations yet" />}

      {registrations.length > 0 && (
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {registrations.map((reg) => (
            <div key={reg._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{reg.participant?.name}</p>
                <p className="text-xs text-neutral-500">{reg.participant?.email}</p>
              </div>
              <EventStatus status={reg.status === 'cancelled' ? 'Cancelled' : 'Registered'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
