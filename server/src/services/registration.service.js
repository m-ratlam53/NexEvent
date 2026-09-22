import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';
import { EVENT_STATUS, REGISTRATION_STATUS } from '../utils/constants.js';
import { combineDateAndTime } from '../utils/deriveDisplayStatus.js';

// Renumbers this event's active waitlist to a contiguous 1..N, ordered by
// each entry's current position (falling back to join order for any that
// haven't been assigned one yet). Called after every join, cancel, and
// promotion so positions never drift or leave gaps.
async function recomputeWaitlistPositions(eventId) {
  const waitlisted = await Registration.find({
    event: eventId,
    status: REGISTRATION_STATUS.WAITLISTED,
  }).sort({ waitlistPosition: 1, createdAt: 1 });

  await Promise.all(
    waitlisted.map((entry, index) => {
      const position = index + 1;
      if (entry.waitlistPosition === position) return null;
      entry.waitlistPosition = position;
      return entry.save();
    }),
  );
}

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
 * Waitlist (mid-hackathon change request): a full event no longer rejects
 * the request outright — the participant joins a FIFO waitlist instead
 * (rule 2 below). A participant may hold only one ACTIVE entry (registered
 * OR waitlisted) per event at a time (rule 5); a previously cancelled entry
 * doesn't block rejoining.
 *
 * Known limitation (spec section 9, unchanged by this change): the
 * capacity check is not atomic — two simultaneous requests for the last
 * seat could both read a count under capacity before either writes. Left
 * as-is per the change request's own guidance not to introduce new
 * infrastructure with limited time remaining; the risk is a rare
 * over-capacity registration on truly simultaneous requests, not a
 * waitlist-correctness issue (this function still isn't spread across the
 * controller, so it remains swappable for an atomic guard later).
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
    status: { $in: [REGISTRATION_STATUS.REGISTERED, REGISTRATION_STATUS.WAITLISTED] },
  }); // 5 — one active entry (registered OR waitlisted) per participant per event
  if (existing) {
    const message =
      existing.status === REGISTRATION_STATUS.WAITLISTED
        ? 'You are already on the waitlist for this event'
        : 'You are already registered for this event';
    throw new AppError(message, 409);
  }

  const registeredCount = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.REGISTERED,
  });

  if (registeredCount < event.capacity) {
    const registration = await Registration.create({
      event: eventId,
      participant: participantId,
      status: REGISTRATION_STATUS.REGISTERED,
    });
    return { registration, outcome: REGISTRATION_STATUS.REGISTERED };
  }

  // 6 — full: join the waitlist instead of rejecting outright.
  const waitlistCount = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.WAITLISTED,
  });
  const registration = await Registration.create({
    event: eventId,
    participant: participantId,
    status: REGISTRATION_STATUS.WAITLISTED,
    waitlistPosition: waitlistCount + 1,
  });
  return { registration, outcome: REGISTRATION_STATUS.WAITLISTED };
}

export async function cancelRegistration(participantId, registrationId) {
  const registration = await Registration.findById(registrationId);
  if (!registration) throw new AppError('Registration not found', 404);
  if (registration.participant.toString() !== participantId) {
    throw new AppError('You do not have permission to cancel this registration', 403);
  }

  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    return { registration, promoted: null }; // already cancelled — idempotent, no re-promotion
  }

  const wasRegistered = registration.status === REGISTRATION_STATUS.REGISTERED;
  registration.status = REGISTRATION_STATUS.CANCELLED;
  registration.waitlistPosition = null;
  await registration.save();

  let promoted = null;
  if (wasRegistered) {
    // A confirmed seat just opened up — automatically promote the earliest
    // waitlisted participant into it (rule 5). Cancelling a waitlist entry
    // (the `else` case, handled by the recompute below) never promotes
    // anyone — it only closes the gap in the queue behind it (rule 6).
    promoted = await Registration.findOne({
      event: registration.event,
      status: REGISTRATION_STATUS.WAITLISTED,
    }).sort({ waitlistPosition: 1, createdAt: 1 });

    if (promoted) {
      promoted.status = REGISTRATION_STATUS.REGISTERED;
      promoted.waitlistPosition = null;
      await promoted.save();
    }
  }

  await recomputeWaitlistPositions(registration.event);

  return { registration, promoted };
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
