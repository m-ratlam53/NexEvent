import { EVENT_STATUS, DISPLAY_STATUS } from './constants.js';

export function combineDateAndTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function isMultiDayEvent(date, endDate) {
  if (!endDate) return false;
  return new Date(date).toDateString() !== new Date(endDate).toDateString();
}

/**
 * Section 8 of the spec: displayStatus is never stored, always derived from
 * status + date + startTime + endTime + live registered count.
 */
export function deriveDisplayStatus(event, registeredCount = 0) {
  if (event.status === EVENT_STATUS.CANCELLED) return DISPLAY_STATUS.CANCELLED;

  const now = new Date();
  const start = combineDateAndTime(event.date, event.startTime);
  // `|| event.date` covers any pre-existing document saved before `endDate`
  // existed on the schema.
  const end = combineDateAndTime(event.endDate || event.date, event.endTime);

  if (now > end) return DISPLAY_STATUS.COMPLETED;
  if (now >= start && now <= end) return DISPLAY_STATUS.ONGOING;
  if (event.status === EVENT_STATUS.DRAFT) return DISPLAY_STATUS.DRAFT;

  if (registeredCount >= event.capacity) return DISPLAY_STATUS.FULL;
  if (registeredCount >= event.capacity * 0.9) return DISPLAY_STATUS.ALMOST_FULL;

  return DISPLAY_STATUS.UPCOMING;
}
