import api from './api';

export async function fetchEvents(params) {
  const { data } = await api.get('/events', { params });
  return data.events;
}

export async function fetchEventById(id) {
  const { data } = await api.get(`/events/${id}`);
  return data.event;
}

export async function fetchOrganizerEvents() {
  const { data } = await api.get('/organizer/events');
  return data.events;
}

export async function createEventRequest(payload) {
  const { data } = await api.post('/events', payload);
  return data.event;
}

export async function updateEventRequest(id, payload) {
  const { data } = await api.put(`/events/${id}`, payload);
  return data.event;
}

export async function publishEventRequest(id) {
  const { data } = await api.patch(`/events/${id}/publish`);
  return data.event;
}

export async function cancelEventRequest(id) {
  const { data } = await api.patch(`/events/${id}/cancel`);
  return data.event;
}
