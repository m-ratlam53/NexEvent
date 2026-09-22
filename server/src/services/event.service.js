import { Event } from '../models/Event.js';
import { AppError } from '../utils/AppError.js';
import { EVENT_STATUS } from '../utils/constants.js';
import { deriveDisplayStatus } from '../utils/deriveDisplayStatus.js';
import { validateEventInput } from '../validators/event.validators.js';

function pickEventFields(data) {
  const { name, description, category, date, startTime, endTime, mode, location, capacity } = data;
  return { name, description, category, date, startTime, endTime, mode, location, capacity };
}

// registeredCount defaults to 0 until the Registration model exists (Phase 5),
// which will pass in Registration.countDocuments({event, status:"registered"}).
function toEventDTO(eventDoc, registeredCount = 0) {
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

export async function listPublishedEvents({ category, date, search } = {}) {
  const query = { status: EVENT_STATUS.PUBLISHED };

  if (category) query.category = category;
  if (date) {
    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    query.date = { $gte: day, $lt: nextDay };
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const events = await Event.find(query).sort({ date: 1 }).populate('organizer', 'name');
  return events.map((event) => toEventDTO(event, 0));
}

export async function getEventById(eventId, requester) {
  const event = await Event.findById(eventId).populate('organizer', 'name email');
  if (!event) throw new AppError('Event not found', 404);

  const isOwner = Boolean(requester) && event.organizer._id.toString() === requester.id;
  if (event.status === EVENT_STATUS.DRAFT && !isOwner) {
    throw new AppError('Event not found', 404);
  }

  return toEventDTO(event, 0);
}

export async function getOrganizerEvents(organizerId) {
  const events = await Event.find({ organizer: organizerId }).sort({ createdAt: -1 });
  return events.map((event) => toEventDTO(event, 0));
}
