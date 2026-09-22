import { Router } from 'express';
import { signup, login, me, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', signup);
router.post('/login', login);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateProfile);
router.patch('/me/password', authenticate, changePassword);

export default router;
