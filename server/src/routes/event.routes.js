import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', eventController.list);
router.get('/:id', optionalAuthenticate, eventController.getById);
router.post('/', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.create);
router.put('/:id', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.update);
router.patch('/:id/publish', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.publish);
router.patch('/:id/cancel', authenticate, authorize(USER_ROLES.ORGANIZER), eventController.cancel);

export default router;
