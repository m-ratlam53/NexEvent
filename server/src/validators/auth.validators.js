import { AppError } from '../utils/AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['participant', 'organizer'];

export function validateSignup(body) {
  const { name, email, password, role } = body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Name is required');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push('Password must contain both letters and numbers');
  }
  if (!role || !ROLES.includes(role)) errors.push('Role must be either participant or organizer');

  if (errors.length) throw new AppError(errors.join('; '), 400);
}

export function validateLogin(body) {
  const { email, password } = body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');
  if (!password) errors.push('Password is required');

  if (errors.length) throw new AppError(errors.join('; '), 400);
}
