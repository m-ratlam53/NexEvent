import api from './api';

export async function fetchOrganizerAnalytics() {
  const { data } = await api.get('/organizer/analytics');
  return data.analytics;
}

export async function fetchEventAnalytics(eventId) {
  const { data } = await api.get(`/events/${eventId}/analytics`);
  return data.analytics;
}
