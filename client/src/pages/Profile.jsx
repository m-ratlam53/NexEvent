import { useAuth } from '../context/AuthContext';
import PageFade from '../components/motion/Reveal';

// Minimal placeholder so the sidebar's Profile link isn't broken — full
// profile editing/account settings are a separate, later task.
export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageFade>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Your account details.</p>
      </PageFade>

      <PageFade delay={0.05} className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-semibold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-neutral-900">{user?.name}</p>
            <p className="truncate text-sm text-neutral-500">{user?.email}</p>
            <p className="mt-0.5 text-xs font-semibold capitalize text-brand-600">{user?.role}</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-neutral-400">Profile editing and account settings are coming soon.</p>
      </PageFade>
    </div>
  );
}
