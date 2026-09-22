import { Router } from 'express';
import { myRegistrations } from '../controllers/registration.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.get('/me/registrations', authenticate, authorize(USER_ROLES.PARTICIPANT), myRegistrations);

export default router;
