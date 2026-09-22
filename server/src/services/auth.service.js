import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email: normalizedEmail, passwordHash, role });

  const token = signToken({ userId: user._id.toString(), role: user.role });
  return { user, token };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const token = signToken({ userId: user._id.toString(), role: user.role });
  return { user, token };
}

export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

// Email is deliberately excluded here — it's the login identifier (see
// loginUser above) and this app has no email-verification flow, so
// letting it change unverified would risk silently locking a user out.
// Role is likewise never editable via this path.
export async function updateUserProfile(userId, { name, profileImage }) {
  const update = {};
  if (name !== undefined) update.name = name;
  if (profileImage !== undefined) update.profileImage = profileImage;

  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
}
