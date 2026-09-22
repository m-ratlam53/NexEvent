import api from './api';

// Returns the full response — { status, message, waitlistPosition?,
// registration } — since the caller needs to distinguish a direct
// registration from a waitlist join, not just the created record.
export async function registerForEvent(eventId) {
  const { data } = await api.post('/registrations', { eventId });
  return data;
}

// Returns { registration, promoted, message } — `promoted` is the
// registration (if any) that was auto-promoted from the waitlist as a
// result of this cancellation.
export async function cancelRegistrationRequest(registrationId) {
  const { data } = await api.patch(`/registrations/${registrationId}/cancel`);
  return data;
}

export async function fetchMyRegistrations() {
  const { data } = await api.get('/users/me/registrations');
  return data.registrations;
}
