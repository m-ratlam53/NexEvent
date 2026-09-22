import { Router } from 'express';
import { organizerEvents } from '../controllers/event.controller.js';
import { dashboard } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.get('/events', authenticate, authorize(USER_ROLES.ORGANIZER), organizerEvents);
router.get('/analytics', authenticate, authorize(USER_ROLES.ORGANIZER), dashboard);

export default router;
