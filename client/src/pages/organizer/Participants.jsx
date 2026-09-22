import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById, fetchEventRegistrations } from '../../services/events.service';
import EventStatus from '../../components/EventStatus';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import PageFade, { RevealGroup, RevealItem } from '../../components/motion/Reveal';

function ParticipantRow({ reg, statusLabel }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-xs font-semibold text-white">
          {reg.participant?.name?.[0]?.toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{reg.participant?.name}</p>
          <p className="text-xs text-neutral-500">{reg.participant?.email}</p>
        </div>
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
      <Link
        to="/organizer/events"
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to Dashboard
      </Link>
      <PageFade delay={0.05}>
        <h1 className="font-display mb-1 mt-3 text-2xl font-bold text-neutral-900">{event.name}</h1>
        <p className="mb-6 text-sm text-neutral-500">
          {registered.length} registered of {event.capacity} seats
          {waitlisted.length > 0 && ` · ${waitlisted.length} waitlisted`}
        </p>
      </PageFade>

      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Registered</h2>
      {registered.length === 0 ? (
        <div className="mb-8">
          <EmptyState title="No one registered yet" />
        </div>
      ) : (
        <RevealGroup className="mb-8 space-y-2.5" stagger={0.04}>
          {registered.map((reg) => (
            <RevealItem key={reg._id}>
              <ParticipantRow reg={reg} statusLabel="Registered" />
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      {waitlisted.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Waitlisted</h2>
          <RevealGroup className="space-y-2.5" stagger={0.04}>
            {waitlisted.map((reg) => (
              <RevealItem key={reg._id}>
                <ParticipantRow reg={reg} statusLabel={`Waitlisted · #${reg.waitlistPosition}`} />
              </RevealItem>
            ))}
          </RevealGroup>
        </>
      )}
    </div>
  );
}
