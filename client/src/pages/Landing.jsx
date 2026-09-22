import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/explore" replace />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-semibold text-neutral-900">NexEvent</span>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="text-neutral-600 hover:text-neutral-900">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          Discover events. Register in seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
          NexEvent connects organizers and participants — create and manage events, or find what's happening near
          you and reserve your seat.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Log in
          </Link>
        </div>
      </main>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">For participants</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Search, filter, and register for events with real-time seat availability — join the waitlist
              automatically if an event is full.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">For organizers</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Create and publish events, manage capacity, track registrations, and see attendance analytics at a
              glance.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Find your venue</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Every onsite event shows an interactive map and directions, so participants always know exactly
              where to go.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
