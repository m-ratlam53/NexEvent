import api from './api';

export async function registerForEvent(eventId) {
  const { data } = await api.post('/registrations', { eventId });
  return data.registration;
}

export async function cancelRegistrationRequest(registrationId) {
  const { data } = await api.patch(`/registrations/${registrationId}/cancel`);
  return data.registration;
}

export async function fetchMyRegistrations() {
  const { data } = await api.get('/users/me/registrations');
  return data.registrations;
}
