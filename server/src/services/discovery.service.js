import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { EVENT_STATUS, REGISTRATION_STATUS, DISPLAY_STATUS } from '../utils/constants.js';
import { countRegisteredByEvent, toEventDTO } from './event.service.js';

/**
 * Section 11 "Smart Event Discovery" — a plain, explainable ranked fallback,
 * not ML. Rule 1 picks the CANDIDATE POOL; rules 2/3 are the SORT applied to
 * whichever pool gets used:
 *
 *   1. If the participant has ever registered for an event, narrow the pool
 *      to published/upcoming events in those categories. If that narrowed
 *      pool is empty (no current events in their categories), fall back to
 *      the full pool of published/upcoming events instead of showing nothing.
 *   2. Rank the chosen pool by current registration count, most popular first.
 *   3. Break ties (including the common all-zero case for a fresh event
 *      list) by soonest date.
 */
export async function getRecommendedEvents(participantId, limit = 6) {
  const [history, activeRegistrations, publishedEvents] = await Promise.all([
    Registration.find({ participant: participantId }).populate('event', 'category'),
    Registration.find({ participant: participantId, status: REGISTRATION_STATUS.REGISTERED }).select('event'),
    Event.find({ status: EVENT_STATUS.PUBLISHED }).populate('organizer', 'name'),
  ]);

  const registeredEventIds = new Set(activeRegistrations.map((r) => r.event.toString()));
  const registeredCategories = new Set(history.filter((r) => r.event).map((r) => r.event.category));

  const countMap = await countRegisteredByEvent(publishedEvents.map((e) => e._id));

  const eligible = publishedEvents
    .filter((event) => !registeredEventIds.has(event._id.toString()))
    .map((event) => toEventDTO(event, countMap.get(event._id.toString()) || 0))
    .filter((event) => event.displayStatus !== DISPLAY_STATUS.COMPLETED);

  const categoryMatches =
    registeredCategories.size > 0 ? eligible.filter((event) => registeredCategories.has(event.category)) : [];

  const pool = categoryMatches.length > 0 ? categoryMatches : eligible;

  const ranked = [...pool].sort((a, b) => {
    if (b.registeredCount !== a.registeredCount) return b.registeredCount - a.registeredCount; // rule 2
    return new Date(a.date) - new Date(b.date); // rule 3
  });

  return ranked.slice(0, limit);
}
