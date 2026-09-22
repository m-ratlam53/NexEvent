import * as registrationService from '../services/registration.service.js';
import { REGISTRATION_STATUS } from '../utils/constants.js';

export async function register(req, res, next) {
  try {
    const { registration, outcome } = await registrationService.registerParticipant(req.user.id, req.body.eventId);
    const message =
      outcome === REGISTRATION_STATUS.WAITLISTED
        ? "Event is full. You've been added to the waitlist."
        : 'Registration confirmed';

    res.status(201).json({
      status: outcome,
      message,
      waitlistPosition: registration.waitlistPosition ?? undefined,
      registration,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const { registration, promoted } = await registrationService.cancelRegistration(req.user.id, req.params.id);

    res.json({
      registration,
      promoted,
      message: promoted
        ? 'Registration cancelled. The next waitlisted participant has been promoted.'
        : 'Registration cancelled.',
    });
  } catch (err) {
    next(err);
  }
}

export async function myRegistrations(req, res, next) {
  try {
    const registrations = await registrationService.getParticipantRegistrations(req.user.id);
    res.json({ registrations });
  } catch (err) {
    next(err);
  }
}

export async function eventRegistrations(req, res, next) {
  try {
    const registrations = await registrationService.getEventRegistrations(req.params.id, req.user.id);
    res.json({ registrations });
  } catch (err) {
    next(err);
  }
}
