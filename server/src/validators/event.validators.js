import { AppError } from '../utils/AppError.js';
import { EVENT_CATEGORIES, EVENT_MODE } from '../utils/constants.js';
import { combineDateAndTime, isMultiDayEvent } from '../utils/deriveDisplayStatus.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
// ~5MB decoded, generous enough for a compressed poster image, small
// enough to stay well clear of MongoDB's 16MB document limit.
const MAX_POSTER_LENGTH = 7_000_000;

export function validateEventInput(body) {
  const {
    name,
    category,
    date,
    endDate,
    startTime,
    endTime,
    mode,
    location,
    capacity,
    registrationDeadline,
    posterUrl,
  } = body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Event name is required');
  if (!category || !EVENT_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }

  const validDate = date && !Number.isNaN(new Date(date).getTime());
  if (!validDate) errors.push('A valid event date is required');

  const validEndDate = endDate && !Number.isNaN(new Date(endDate).getTime());
  if (!validEndDate) errors.push('A valid end date is required');
  if (validDate && validEndDate && new Date(endDate) < new Date(date)) {
    errors.push('End date must be on or after the start date');
  }

  const validStart = startTime && TIME_REGEX.test(startTime);
  const validEnd = endTime && TIME_REGEX.test(endTime);
  if (!validStart) errors.push('Start time must be in HH:mm format');
  if (!validEnd) errors.push('End time must be in HH:mm format');
  // Once the event spans multiple calendar days, the end day is strictly
  // later than the start day, so the end instant is already after the start
  // instant regardless of clock times — the same-day ordering check would be
  // meaningless (and wrong) here.
  if (
    validStart &&
    validEnd &&
    validDate &&
    validEndDate &&
    !isMultiDayEvent(date, endDate) &&
    endTime <= startTime
  ) {
    errors.push('End time must be after start time');
  }

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

  if (registrationDeadline) {
    const deadline = new Date(registrationDeadline);
    if (Number.isNaN(deadline.getTime())) {
      errors.push('Registration deadline must be a valid date');
    } else if (validStart && date && !Number.isNaN(new Date(date).getTime())) {
      const eventStart = combineDateAndTime(date, startTime);
      if (deadline > eventStart) {
        errors.push('Registration deadline must be before the event starts');
      }
    }
  }

  if (posterUrl && typeof posterUrl === 'string' && posterUrl.length > MAX_POSTER_LENGTH) {
    errors.push('Poster image is too large (max ~5MB)');
  }

  if (errors.length) throw new AppError(errors.join('; '), 400);
}
