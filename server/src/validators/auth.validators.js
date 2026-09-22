import { AppError } from '../utils/AppError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['participant', 'organizer'];
// ~5MB decoded, same cap as Event.posterUrl (see event.validators.js) —
// generous enough for a compressed photo, small enough to stay well clear
// of MongoDB's 16MB document limit.
const MAX_PROFILE_IMAGE_LENGTH = 7_000_000;

function validatePasswordStrength(password, errors, label = 'Password') {
  if (!password || password.length < 8) {
    errors.push(`${label} must be at least 8 characters`);
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push(`${label} must contain both letters and numbers`);
  }
}

export function validateSignup(body) {
  const { name, email, password, role } = body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Name is required');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('A valid email is required');
  validatePasswordStrength(password, errors);
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

export function validateProfileUpdate(body) {
  const { name, profileImage } = body;
  const errors = [];

  if (name !== undefined && !name.trim()) errors.push('Name cannot be empty');
  if (profileImage && typeof profileImage === 'string' && profileImage.length > MAX_PROFILE_IMAGE_LENGTH) {
    errors.push('Profile image is too large (max ~5MB)');
  }

  if (errors.length) throw new AppError(errors.join('; '), 400);
}

export function validatePasswordChange(body) {
  const { currentPassword, newPassword } = body;
  const errors = [];

  if (!currentPassword) errors.push('Current password is required');
  validatePasswordStrength(newPassword, errors, 'New password');

  if (errors.length) throw new AppError(errors.join('; '), 400);
}
