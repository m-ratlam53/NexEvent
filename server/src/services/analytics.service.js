import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { AppError } from '../utils/AppError.js';
import { REGISTRATION_STATUS, DISPLAY_STATUS } from '../utils/constants.js';
import { deriveDisplayStatus } from '../utils/deriveDisplayStatus.js';
import { countRegisteredByEvent } from './event.service.js';

const UPCOMING_STATUSES = [
  DISPLAY_STATUS.UPCOMING,
  DISPLAY_STATUS.ALMOST_FULL,
  DISPLAY_STATUS.FULL,
  DISPLAY_STATUS.ONGOING,
];

function registrationPercentage(registered, capacity) {
  if (!capacity) return 0;
  return Math.round((registered / capacity) * 1000) / 10;
}

// Waitlist count is informational only — never folded into
// registeredCount/availableSeats/registrationPercentage, which stay based
// on REGISTERED entries alone (change request: "capacity/fill % ... never
// inflated by waitlist").
async function countWaitlistedByEvent(eventIds) {
  const counts = await Registration.aggregate([
    { $match: { event: { $in: eventIds }, status: REGISTRATION_STATUS.WAITLISTED } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}

// Section 12: only these six numbers, computed from live data — never a
// separately-maintained counter. waitlistedCount/totalWaitlisted are an
// addition on top, not a replacement.
export async function getOrganizerDashboardAnalytics(organizerId) {
  const events = await Event.find({ organizer: organizerId });
  const eventIds = events.map((e) => e._id);
  const [registeredCountMap, waitlistedCountMap] = await Promise.all([
    countRegisteredByEvent(eventIds),
    countWaitlistedByEvent(eventIds),
  ]);

  const eventStats = events.map((event) => {
    const registeredCount = registeredCountMap.get(event._id.toString()) || 0;
    const waitlistedCount = waitlistedCountMap.get(event._id.toString()) || 0;
    const displayStatus = deriveDisplayStatus(event, registeredCount);
    return {
      eventId: event._id,
      name: event.name,
      status: event.status,
      displayStatus,
      capacity: event.capacity,
      registeredCount,
      waitlistedCount,
      availableSeats: Math.max(event.capacity - registeredCount, 0),
    };
  });

  const totalRegistrations = eventStats.reduce((sum, e) => sum + e.registeredCount, 0);
  const totalWaitlisted = eventStats.reduce((sum, e) => sum + e.waitlistedCount, 0);
  const totalCapacity = eventStats.reduce((sum, e) => sum + e.capacity, 0);

  return {
    totalEvents: eventStats.length,
    upcomingEventsCount: eventStats.filter((e) => UPCOMING_STATUSES.includes(e.displayStatus)).length,
    totalRegistrations,
    totalWaitlisted,
    availableSeats: eventStats.reduce((sum, e) => sum + e.availableSeats, 0),
    registrationPercentage: registrationPercentage(totalRegistrations, totalCapacity),
    events: eventStats,
  };
}

export async function getEventAnalytics(eventId, organizerId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizer.toString() !== organizerId) {
    throw new AppError("You do not have permission to view this event's analytics", 403);
  }

  const [registeredCount, waitlistedCount] = await Promise.all([
    Registration.countDocuments({ event: eventId, status: REGISTRATION_STATUS.REGISTERED }),
    Registration.countDocuments({ event: eventId, status: REGISTRATION_STATUS.WAITLISTED }),
  ]);

  return {
    eventId: event._id,
    name: event.name,
    status: event.status,
    displayStatus: deriveDisplayStatus(event, registeredCount),
    capacity: event.capacity,
    registeredCount,
    waitlistedCount,
    availableSeats: Math.max(event.capacity - registeredCount, 0),
    registrationPercentage: registrationPercentage(registeredCount, event.capacity),
  };
}
