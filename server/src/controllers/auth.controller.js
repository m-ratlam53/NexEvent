import { validateSignup, validateLogin } from '../validators/auth.validators.js';
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';

export async function signup(req, res, next) {
  try {
    validateSignup(req.body);
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    validateLogin(req.body);
    const { user, token } = await loginUser(req.body);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
