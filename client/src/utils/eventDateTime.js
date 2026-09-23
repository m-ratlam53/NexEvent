// Single place that knows how to read a possibly-multi-day event. `endDate`
// is always populated by the backend (falls back to `date` for a
// single-day event), so display code only needs to check whether the two
// differ to decide whether to render a date range.

export function eventEndDate(event) {
  return event?.endDate || event?.date;
}

export function isMultiDayEvent(event) {
  if (!event?.date) return false;
  return new Date(event.date).toDateString() !== new Date(eventEndDate(event)).toDateString();
}

export function formatEventDate(event, { long = false } = {}) {
  const startOpts = long
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' };
  const startStr = new Date(event.date).toLocaleDateString(undefined, startOpts);

  if (!isMultiDayEvent(event)) return startStr;

  const endOpts = long ? { month: 'long', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' };
  const endStr = new Date(eventEndDate(event)).toLocaleDateString(undefined, endOpts);
  return `${startStr} – ${endStr}`;
}
