const STYLES = {
  Draft: 'bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
  Upcoming:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  'Almost Full':
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  Full: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
  Ongoing: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30',
  Completed: 'bg-neutral-100 text-neutral-500 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700',
  Cancelled: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
  Registered:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  Waitlisted: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
};

export default function EventStatus({ status }) {
  // "Waitlisted · #3" etc. still match the base "Waitlisted" style.
  const styleKey = Object.keys(STYLES).find((key) => status?.startsWith(key));
  const style =
    STYLES[styleKey] || 'bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
