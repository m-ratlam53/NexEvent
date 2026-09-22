const STYLES = {
  Draft: 'bg-neutral-100 text-neutral-600',
  Upcoming: 'bg-emerald-50 text-emerald-700',
  'Almost Full': 'bg-amber-50 text-amber-700',
  Full: 'bg-red-50 text-red-700',
  Ongoing: 'bg-blue-50 text-blue-700',
  Completed: 'bg-neutral-100 text-neutral-500',
  Cancelled: 'bg-red-50 text-red-600',
  Registered: 'bg-emerald-50 text-emerald-700',
  Waitlisted: 'bg-amber-50 text-amber-700',
};

export default function EventStatus({ status }) {
  // "Waitlisted · #3" etc. still match the base "Waitlisted" style.
  const styleKey = Object.keys(STYLES).find((key) => status?.startsWith(key));
  const style = STYLES[styleKey] || 'bg-neutral-100 text-neutral-600';
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
