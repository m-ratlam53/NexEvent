import { AppError } from '../utils/AppError.js';
import { EVENT_CATEGORIES, EVENT_MODE } from '../utils/constants.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateEventInput(body) {
  const { name, category, date, startTime, endTime, mode, location, capacity } = body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Event name is required');
  if (!category || !EVENT_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }
  if (!date || Number.isNaN(new Date(date).getTime())) errors.push('A valid event date is required');

  const validStart = startTime && TIME_REGEX.test(startTime);
  const validEnd = endTime && TIME_REGEX.test(endTime);
  if (!validStart) errors.push('Start time must be in HH:mm format');
  if (!validEnd) errors.push('End time must be in HH:mm format');
  if (validStart && validEnd && endTime <= startTime) errors.push('End time must be after start time');

  if (!mode || !Object.values(EVENT_MODE).includes(mode)) errors.push('Mode must be onsite or online');

  // The map picker (EventMap, later phase) fills latitude/longitude from a
  // geocoding result — the organizer never types coordinates by hand, so we
  // only require a venue address here, not lat/lng.
  if (mode === EVENT_MODE.ONSITE && (!location || !location.address || !location.address.trim())) {
    errors.push('Onsite events require a venue address');
  }

  if (capacity === undefined || capacity === null || Number(capacity) < 1) {
    errors.push('Capacity must be at least 1');
  }

  if (errors.length) throw new AppError(errors.join('; '), 400);
}
