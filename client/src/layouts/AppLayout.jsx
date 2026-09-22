import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-semibold text-neutral-900">
            NexEvent
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-neutral-600 hover:text-neutral-900">
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
            <span className="text-neutral-400">{user?.name}</span>
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
