import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById, fetchEventRegistrations } from '../../services/events.service';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

function ParticipantRow({ reg, statusLabel }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-neutral-900">{reg.participant?.name}</p>
        <p className="text-xs text-neutral-500">{reg.participant?.email}</p>
      </div>
      <EventStatus status={statusLabel} />
    </div>
  );
}

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

  const registered = registrations.filter((r) => r.status === 'registered');
  const waitlisted = registrations
    .filter((r) => r.status === 'waitlisted')
    .sort((a, b) => a.waitlistPosition - b.waitlistPosition);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/organizer/events" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-semibold text-neutral-900">{event.name} — Participants</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {registered.length} registered of {event.capacity} seats
        {waitlisted.length > 0 && ` · ${waitlisted.length} waitlisted`}
      </p>

      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Registered</h2>
      {registered.length === 0 ? (
        <EmptyState title="No one registered yet" />
      ) : (
        <div className="mb-8 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {registered.map((reg) => (
            <ParticipantRow key={reg._id} reg={reg} statusLabel="Registered" />
          ))}
        </div>
      )}

      {waitlisted.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Waitlisted</h2>
          <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {waitlisted.map((reg) => (
              <ParticipantRow key={reg._id} reg={reg} statusLabel={`Waitlisted · #${reg.waitlistPosition}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
