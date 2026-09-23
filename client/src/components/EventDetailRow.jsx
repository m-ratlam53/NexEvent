import { formatEventDate, formatEventTimeRange } from '../utils/eventDateTime';

const ICONS = {
  date: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  time: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v5.25l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  venue: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  organizer: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
};

// Shared with CapacityIndicator's optional `icon` prop wherever it's used
// alongside this row, so the "seats" glyph stays consistent with the rest
// of the icon set here.
export const SEATS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-3.5 w-3.5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

function buildItems(event) {
  const items = [
    { key: 'date', icon: ICONS.date, label: 'Date', value: formatEventDate(event) },
    { key: 'time', icon: ICONS.time, label: 'Time', value: formatEventTimeRange(event) },
  ];
  if (event.mode === 'onsite' && event.location?.address) {
    items.push({ key: 'venue', icon: ICONS.venue, label: 'Venue', value: event.location.address });
  }
  if (event.organizer?.name) {
    items.push({ key: 'organizer', icon: ICONS.organizer, label: 'Organizer', value: event.organizer.name });
  }
  return items;
}

function Item({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{label}</p>
        <p className="text-sm font-medium leading-tight text-neutral-900 dark:text-neutral-100">{value}</p>
      </div>
    </div>
  );
}

export default function EventDetailRow({ event, compact = false }) {
  const items = buildItems(event);

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map(({ key, ...item }) => (
          <Item key={key} {...item} />
        ))}
      </div>
    );
  }

  // A fixed column count (never flex-wrap) so items always land in a clean
  // grid instead of an item overflowing onto its own ragged, misaligned
  // line whenever the row is a bit too narrow to fit all of them.
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {items.map(({ key, ...item }) => (
        <Item key={key} {...item} />
      ))}
    </div>
  );
}
