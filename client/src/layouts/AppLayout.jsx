import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `relative px-1 py-1 font-medium transition-colors ${
    isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
  }`;

function NavItem({ to, children }) {
  return (
    <NavLink to={to} className={navLinkClass}>
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/75 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3.5">
          <Link to="/explore" className="font-display text-base font-bold text-neutral-900">
            Nex<span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">Event</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <NavItem to="/explore">Explore</NavItem>
            {user?.role === 'participant' && <NavItem to="/my-registrations">My Registrations</NavItem>}
            {user?.role === 'organizer' && <NavItem to="/organizer/events">Dashboard</NavItem>}
            <span className="hidden items-center gap-2 border-l border-neutral-200 pl-4 text-neutral-400 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </span>
              {user?.name}
            </span>
            <button onClick={logout} className="font-medium text-neutral-500 transition-colors hover:text-neutral-900">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
