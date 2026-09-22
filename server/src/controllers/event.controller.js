import * as eventService from '../services/event.service.js';
import { getRecommendedEvents } from '../services/discovery.service.js';

export async function create(req, res, next) {
  try {
    const event = await eventService.createEvent(req.user.id, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const event = await eventService.updateEvent(req.params.id, req.user.id, req.body);
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function publish(req, res, next) {
  try {
    const event = await eventService.publishEvent(req.params.id, req.user.id);
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const event = await eventService.cancelEvent(req.params.id, req.user.id);
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { category, date, search, sort } = req.query;
    const events = await eventService.listPublishedEvents({ category, date, search, sort });
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

export async function recommended(req, res, next) {
  try {
    const events = await getRecommendedEvents(req.user.id);
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id, req.user);
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function organizerEvents(req, res, next) {
  try {
    const events = await eventService.getOrganizerEvents(req.user.id);
    res.json({ events });
  } catch (err) {
    next(err);
  }
}
