import * as registrationService from '../services/registration.service.js';

export async function register(req, res, next) {
  try {
    const registration = await registrationService.registerParticipant(req.user.id, req.body.eventId);
    res.status(201).json({ registration });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const registration = await registrationService.cancelRegistration(req.user.id, req.params.id);
    res.json({ registration });
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
