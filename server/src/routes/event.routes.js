import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { eventRegistrations } from '../controllers/registration.controller.js';
import { eventAnalytics } from '../controllers/analytics.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', eventController.list);
router.get('/recommended', authenticate, authorize(USER_ROLES.PARTICIPANT), eventController.recommended);
router.get('/:id', optionalAuthenticate, eventController.getById);
router.post('/', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.create);
router.put('/:id', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.update);
router.patch('/:id/publish', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.publish);
router.patch('/:id/cancel', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.cancel);
router.get('/:id/registrations', authenticate, authorize(USER_ROLES.ORGANIZER), eventRegistrations);
router.get('/:id/analytics', authenticate, authorize(USER_ROLES.ORGANIZER), eventAnalytics);

export default router;
