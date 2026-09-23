import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';
import { EVENT_STATUS, REGISTRATION_STATUS } from '../utils/constants.js';
import { deriveDisplayStatus } from '../utils/deriveDisplayStatus.js';
import { validateEventInput } from '../validators/event.validators.js';

function pickEventFields(data) {
  const {
    name,
    description,
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
  } = data;
  return {
    name,
    description,
    category,
    date,
    // Falls back to `date` so a single-day event (which never sends its own
    // endDate) always has one — every read site can rely on endDate existing
    // without checking for it first.
    endDate: endDate || date,
    startTime,
    endTime,
    mode,
    location,
    capacity,
    registrationDeadline: registrationDeadline || null,
    posterUrl: posterUrl || null,
  };
}

// Registration counts are always derived from Registration.countDocuments,
// never a stored counter on Event (spec section 7) — never out of sync.
// Exported for reuse by discovery.service.js.
export async function countRegisteredByEvent(eventIds) {
  const counts = await Registration.aggregate([
    { $match: { event: { $in: eventIds }, status: REGISTRATION_STATUS.REGISTERED } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}

async function countRegisteredForEvent(eventId) {
  return Registration.countDocuments({ event: eventId, status: REGISTRATION_STATUS.REGISTERED });
}

export function toEventDTO(eventDoc, registeredCount = 0) {
  const event = eventDoc.toObject ? eventDoc.toObject() : eventDoc;
  return {
    ...event,
    registeredCount,
    displayStatus: deriveDisplayStatus(event, registeredCount),
  };
}

async function findOwnedEvent(eventId, organizerId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizer.toString() !== organizerId) {
    throw new AppError('You do not have permission to modify this event', 403);
  }
  return event;
}

export async function createEvent(organizerId, data) {
  validateEventInput(data);
  const event = await Event.create({
    ...pickEventFields(data),
    organizer: organizerId,
    status: EVENT_STATUS.DRAFT,
  });
  return toEventDTO(event);
}

export async function updateEvent(eventId, organizerId, data) {
  const event = await findOwnedEvent(eventId, organizerId);
  validateEventInput(data);
  Object.assign(event, pickEventFields(data));
  await event.save();
  return toEventDTO(event);
}

export async function publishEvent(eventId, organizerId) {
  const event = await findOwnedEvent(eventId, organizerId);
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError('A cancelled event cannot be published', 400);
  }
  event.status = EVENT_STATUS.PUBLISHED;
  await event.save();
  return toEventDTO(event);
}

export async function cancelEvent(eventId, organizerId) {
  const event = await findOwnedEvent(eventId, organizerId);
  event.status = EVENT_STATUS.CANCELLED;
  await event.save();
  return toEventDTO(event);
}

function applySort(events, sort) {
  if (sort === 'popularity') {
    return [...events].sort((a, b) => b.registeredCount - a.registeredCount);
  }
  if (sort === 'name') {
    return [...events].sort((a, b) => a.name.localeCompare(b.name));
  }
  return events; // 'date' (default) — already sorted soonest-first by the query
}

export async function listPublishedEvents({ category, date, search, sort } = {}) {
  const query = { status: EVENT_STATUS.PUBLISHED };

  if (category) query.category = category;
  if (date) {
    // Overlap match, not exact-day: a multi-day event should surface when
    // the filtered day falls anywhere inside its date..endDate range.
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    query.date = { $lt: nextDay };
    query.endDate = { $gte: day };
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const events = await Event.find(query).sort({ date: 1 }).populate('organizer', 'name');
  const countMap = await countRegisteredByEvent(events.map((e) => e._id));
  const dtos = events.map((event) => toEventDTO(event, countMap.get(event._id.toString()) || 0));
  return applySort(dtos, sort);
}

export async function getEventById(eventId, requester) {
  const event = await Event.findById(eventId).populate('organizer', 'name email');
  if (!event) throw new AppError('Event not found', 404);

  const isOwner = Boolean(requester) && event.organizer._id.toString() === requester.id;
  if (event.status === EVENT_STATUS.DRAFT && !isOwner) {
    throw new AppError('Event not found', 404);
  }

  const registeredCount = await countRegisteredForEvent(event._id);

  let isRegistered = false;
  let isWaitlisted = false;
  let myRegistrationId = null;
  let myWaitlistPosition = null;
  if (requester) {
    const activeRegistration = await Registration.findOne({
      event: event._id,
      participant: requester.id,
      status: { $in: [REGISTRATION_STATUS.REGISTERED, REGISTRATION_STATUS.WAITLISTED] },
    });
    if (activeRegistration?.status === REGISTRATION_STATUS.REGISTERED) {
      isRegistered = true;
      myRegistrationId = activeRegistration._id;
    } else if (activeRegistration?.status === REGISTRATION_STATUS.WAITLISTED) {
      isWaitlisted = true;
      myRegistrationId = activeRegistration._id;
      myWaitlistPosition = activeRegistration.waitlistPosition;
    }
  }

  return {
    ...toEventDTO(event, registeredCount),
    isRegistered,
    isWaitlisted,
    myRegistrationId,
    myWaitlistPosition,
  };
}

async function countWaitlistedByEvent(eventIds) {
  const counts = await Registration.aggregate([
    { $match: { event: { $in: eventIds }, status: REGISTRATION_STATUS.WAITLISTED } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}

export async function getOrganizerEvents(organizerId) {
  const events = await Event.find({ organizer: organizerId }).sort({ createdAt: -1 });
  const eventIds = events.map((e) => e._id);
  const [registeredCountMap, waitlistedCountMap] = await Promise.all([
    countRegisteredByEvent(eventIds),
    countWaitlistedByEvent(eventIds),
  ]);
  return events.map((event) => ({
    ...toEventDTO(event, registeredCountMap.get(event._id.toString()) || 0),
    waitlistedCount: waitlistedCountMap.get(event._id.toString()) || 0,
  }));
}
