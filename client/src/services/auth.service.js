import api from './api';

export async function registerRequest(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfileRequest(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.user;
}

export async function changePasswordRequest(payload) {
  const { data } = await api.patch('/auth/me/password', payload);
  return data;
}
