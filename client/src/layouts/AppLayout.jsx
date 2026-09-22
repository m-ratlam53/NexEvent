import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ICONS = {
  explore: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5h6M9 4.5a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 009 21h6a2.25 2.25 0 002.25-2.25v-12A2.25 2.25 0 0015 4.5M9 4.5V3a.75.75 0 01.75-.75h4.5A.75.75 0 0115 3v1.5m-6 9l3-3 3 3m-3-3v6"
      />
    </svg>
  ),
  registrations: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 6a3 3 0 11-6 0 3 3 0 016 0zm3 11.25a7.5 7.5 0 10-15 0 .75.75 0 00.363.643 12.107 12.107 0 006.137 1.607 12.107 12.107 0 006.137-1.607.75.75 0 00.363-.643z"
      />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3.75m8.5-3.75l1 3.75m0 0l.5 1.5m-9.5-1.5l-.5 1.5m9.5-1.5h-9.5"
      />
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v16.5A1.5 1.5 0 004.5 21H21M7.5 15.75V9m4.5 6.75V5.25m4.5 10.5v-4.5"
      />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 20.25v-1.5a3.75 3.75 0 00-3.75-3.75h-3a3.75 3.75 0 00-3.75 3.75v1.5m10.5-11.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 -3h12m0 0l-3-3m3 3l-3 3"
      />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Exact required order per role — Dashboard/Create Event/Analytics/Explore/
// Profile for organizers, Explore/My Registrations/Profile for participants.
// Logout is rendered separately, below, always last.
const ORGANIZER_NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/organizer/events/new', icon: 'create', label: 'Create Event' },
  { to: '/organizer/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/explore', icon: 'explore', label: 'Explore' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
];

const PARTICIPANT_NAV = [
  { to: '/explore', icon: 'explore', label: 'Explore' },
  { to: '/my-registrations', icon: 'registrations', label: 'My Registrations' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
];

function NavItem({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function SidebarContent({ user, logout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        to="/explore"
        onClick={onNavigate}
        className="font-display flex items-center gap-2 px-2 py-1 text-base font-bold text-neutral-900"
      >
        Nex<span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">Event</span>
      </Link>

      <nav className="mt-8 flex-1 space-y-1">
        {(user?.role === 'organizer' ? ORGANIZER_NAV : PARTICIPANT_NAV).map((item) => (
          <NavItem key={item.to} to={item.to} icon={ICONS[item.icon]} onClick={onNavigate}>
            {item.label}
          </NavItem>
        ))}
      </nav>

      <div className="border-t border-neutral-200 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-xs font-semibold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{user?.name}</p>
            <p className="truncate text-xs capitalize text-neutral-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          {ICONS.logout}
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200/80 bg-white/85 p-4 backdrop-blur-lg md:flex md:flex-col">
        <SidebarContent user={user} logout={logout} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200/70 bg-white/85 px-4 py-3 backdrop-blur-lg md:hidden">
        <Link to="/explore" className="font-display text-base font-bold text-neutral-900">
          Nex<span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">Event</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
        >
          {ICONS.menu}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 shadow-elevated-lg md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="mb-2 self-end rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
              >
                {ICONS.close}
              </button>
              <SidebarContent user={user} logout={logout} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="md:pl-64">
        <Outlet />
      </div>
    </div>
  );
}
