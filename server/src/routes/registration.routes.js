import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.post('/', authenticate, authorize(USER_ROLES.PARTICIPANT), registrationController.register);
router.patch('/:id/cancel', authenticate, authorize(USER_ROLES.PARTICIPANT), registrationController.cancel);

export default router;
