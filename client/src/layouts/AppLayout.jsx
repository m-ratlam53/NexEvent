import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/explore" className="font-semibold text-neutral-900">
            NexEvent
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link to="/explore" className="text-neutral-600 hover:text-neutral-900">
              Explore
            </Link>
            {user?.role === 'participant' && (
              <Link to="/my-registrations" className="text-neutral-600 hover:text-neutral-900">
                My Registrations
              </Link>
            )}
            {user?.role === 'organizer' && (
              <Link to="/organizer/events" className="text-neutral-600 hover:text-neutral-900">
                Dashboard
              </Link>
            )}
            <span className="hidden text-neutral-400 sm:inline">{user?.name}</span>
            <button onClick={logout} className="text-neutral-600 hover:text-neutral-900">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
