import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/motion/TiltCard';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';

const FEATURES = [
  {
    title: 'For participants',
    description:
      "Search, filter, and register for events with real-time seat availability — join the waitlist automatically if an event is full.",
    gradient: 'from-violet-500 to-fuchsia-500',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'For organizers',
    description:
      'Create and publish events, manage capacity, track registrations, and see attendance analytics at a glance.',
    gradient: 'from-indigo-500 to-violet-500',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Find your venue',
    description:
      'Every onsite event shows an interactive map and directions, so participants always know exactly where to go.',
    gradient: 'from-fuchsia-500 to-rose-500',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
  },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to={user.role === 'organizer' ? '/dashboard' : '/explore'} replace />;

  return (
    <div className="min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/70 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">NexEvent</span>
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/login"
              className="font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 font-semibold text-white shadow-elevated transition-all hover:shadow-glow hover:brightness-105 active:scale-95"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="bg-mesh pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)]" />

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:pt-32"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Event discovery & registration, reimagined
          </span>
          <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-6xl">
            Discover events.
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-fuchsia-500 to-brand-500 bg-clip-text text-transparent">
              Register in seconds.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500 dark:text-neutral-400">
            NexEvent connects organizers and participants — create and manage events, or find what's happening
            near you and reserve your seat.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-elevated-lg transition-all hover:shadow-glow hover:brightness-105 active:scale-95"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-neutral-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm backdrop-blur transition-all hover:border-neutral-300 hover:bg-white active:scale-95 dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
            >
              Log in
            </Link>
          </div>
        </motion.div>

        <section className="relative border-t border-neutral-200/70 bg-white/60 py-20 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <RevealGroup className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <RevealItem key={feature.title}>
                <TiltCard className="h-full rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-elevated dark:border-neutral-800 dark:bg-neutral-900">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-elevated`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-display mt-4 text-sm font-bold text-neutral-900 dark:text-neutral-100">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{feature.description}</p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      </main>
    </div>
  );
}
