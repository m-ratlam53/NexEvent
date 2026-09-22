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

// Section 12: only these six numbers, computed from live data — never a
// separately-maintained counter.
export async function getOrganizerDashboardAnalytics(organizerId) {
  const events = await Event.find({ organizer: organizerId });
  const countMap = await countRegisteredByEvent(events.map((e) => e._id));

  const eventStats = events.map((event) => {
    const registeredCount = countMap.get(event._id.toString()) || 0;
    const displayStatus = deriveDisplayStatus(event, registeredCount);
    return {
      eventId: event._id,
      name: event.name,
      status: event.status,
      displayStatus,
      capacity: event.capacity,
      registeredCount,
      availableSeats: Math.max(event.capacity - registeredCount, 0),
    };
  });

  const totalRegistrations = eventStats.reduce((sum, e) => sum + e.registeredCount, 0);
  const totalCapacity = eventStats.reduce((sum, e) => sum + e.capacity, 0);

  return {
    totalEvents: eventStats.length,
    upcomingEventsCount: eventStats.filter((e) => UPCOMING_STATUSES.includes(e.displayStatus)).length,
    totalRegistrations,
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

  const registeredCount = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.REGISTERED,
  });

  return {
    eventId: event._id,
    name: event.name,
    status: event.status,
    displayStatus: deriveDisplayStatus(event, registeredCount),
    capacity: event.capacity,
    registeredCount,
    availableSeats: Math.max(event.capacity - registeredCount, 0),
    registrationPercentage: registrationPercentage(registeredCount, event.capacity),
  };
}
