import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';
import { EVENT_STATUS, REGISTRATION_STATUS } from '../utils/constants.js';
import { combineDateAndTime } from '../utils/deriveDisplayStatus.js';

/**
 * Section 9 registration rules, enforced in order. Steps 2 and 3 from the
 * spec's listing are checked cancelled-first here (rather than the literal
 * "must be published" gate first): with only three status values, a
 * cancelled event can never also be "published", so checking the generic
 * gate first would always swallow the cancelled case behind the vaguer
 * "Registration is closed" message. Checking cancelled specifically first
 * makes both of the spec's distinct messages actually reachable; every
 * input is rejected identically either way.
 *
 * Known limitation (spec section 9): the capacity check below is not
 * atomic — two simultaneous requests for the last seat could both read a
 * count under capacity before either writes. Isolating this logic in a
 * single service function (rather than spreading it across the controller)
 * means it can be swapped for `findOneAndUpdate` with an atomic capacity
 * guard, or a transaction, without touching the controller or routes.
 */
export async function registerParticipant(participantId, eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404); // 1

  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError('Event has been cancelled', 400); // 3
  }
  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw new AppError('Registration is closed', 400); // 2
  }

  const end = combineDateAndTime(event.date, event.endTime);
  if (new Date() > end) {
    throw new AppError('This event has already ended', 400); // 4
  }

  const existing = await Registration.findOne({
    event: eventId,
    participant: participantId,
    status: REGISTRATION_STATUS.REGISTERED,
  });
  if (existing) {
    throw new AppError('You are already registered for this event', 409); // 5
  }

  const registeredCount = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.REGISTERED,
  });
  if (registeredCount >= event.capacity) {
    throw new AppError('Event is full', 400); // 6
  }

  const registration = await Registration.create({ event: eventId, participant: participantId }); // 7
  return registration;
}

export async function cancelRegistration(participantId, registrationId) {
  const registration = await Registration.findById(registrationId);
  if (!registration) throw new AppError('Registration not found', 404);
  if (registration.participant.toString() !== participantId) {
    throw new AppError('You do not have permission to cancel this registration', 403);
  }

  if (registration.status !== REGISTRATION_STATUS.CANCELLED) {
    registration.status = REGISTRATION_STATUS.CANCELLED;
    await registration.save();
  }

  return registration;
}

export async function getParticipantRegistrations(participantId) {
  return Registration.find({ participant: participantId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name' },
    });
}

export async function getEventRegistrations(eventId, organizerId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizer.toString() !== organizerId) {
    throw new AppError('You do not have permission to view this event\'s participants', 403);
  }

  return Registration.find({ event: eventId }).sort({ createdAt: -1 }).populate('participant', 'name email');
}
