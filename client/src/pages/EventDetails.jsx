import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchEventById } from '../services/events.service';
import EventStatus from '../components/EventStatus';
import CapacityIndicator from '../components/CapacityIndicator';
import RegistrationButton from '../components/RegistrationButton';
import EventMap from '../components/EventMap';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PageFade, { RevealGroup, RevealItem } from '../components/motion/Reveal';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function InfoCard({ icon, label, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-400">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <div className="mt-2 text-sm text-neutral-900">{children}</div>
    </div>
  );
}

const ICONS = {
  when: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  where: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  who: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  seats: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  deadline: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75l2.25 1.5" />
    </svg>
  ),
};

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const data = await fetchEventById(id);
      setEvent(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    setStatus('loading');
    load();
  }, [load]);

  if (status === 'loading') return <LoadingState label="Loading event…" />;
  if (status === 'error' || !event) return <ErrorState message="Event not found." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to Explore
      </Link>

      <PageFade delay={0.05}>
        {event.posterUrl ? (
          <div className="relative mt-4 h-56 w-full overflow-hidden rounded-2xl border border-neutral-200/80 shadow-elevated sm:h-80">
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
              <div>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  {event.category}
                </span>
                <h1 className="font-display mt-2 text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
                  {event.name}
                </h1>
              </div>
              <EventStatus status={event.displayStatus} />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {event.category}
              </span>
              <h1 className="font-display mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">{event.name}</h1>
            </div>
            <EventStatus status={event.displayStatus} />
          </div>
        )}
      </PageFade>

      {event.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-5 whitespace-pre-line text-neutral-600"
        >
          {event.description}
        </motion.p>
      )}

      <RevealGroup className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.05}>
        <RevealItem>
          <InfoCard icon={ICONS.when} label="When">
            <p>{formatDate(event.date)}</p>
            <p className="text-neutral-500">
              {event.startTime} – {event.endTime}
            </p>
          </InfoCard>
        </RevealItem>
        <RevealItem>
          <InfoCard icon={ICONS.where} label="Where">
            {event.mode === 'online' ? 'Online' : event.location?.address || 'Venue TBA'}
          </InfoCard>
        </RevealItem>
        <RevealItem>
          <InfoCard icon={ICONS.who} label="Organizer">
            {event.organizer?.name}
          </InfoCard>
        </RevealItem>
        <RevealItem>
          <InfoCard icon={ICONS.seats} label="Seats">
            <CapacityIndicator registeredCount={event.registeredCount} capacity={event.capacity} />
          </InfoCard>
        </RevealItem>
        {event.registrationDeadline && (
          <RevealItem className="sm:col-span-2">
            <InfoCard icon={ICONS.deadline} label="Registration closes">
              {formatDateTime(event.registrationDeadline)}
            </InfoCard>
          </RevealItem>
        )}
      </RevealGroup>

      {event.mode === 'onsite' && event.location?.latitude != null && event.location?.longitude != null && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-neutral-700">Venue map</p>
          <EventMap mode="display" value={event.location} />
        </div>
      )}

      {event.isRegistered && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/70"
        >
          You're registered for this event.
        </motion.p>
      )}
      {event.isWaitlisted && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200/70"
        >
          You're on the waitlist — position #{event.myWaitlistPosition}. You'll be registered automatically if a
          seat opens up.
        </motion.p>
      )}

      <div className="mt-4">
        <RegistrationButton event={event} onChange={load} />
      </div>
    </div>
  );
}
