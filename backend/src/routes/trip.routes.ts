import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as tripController from '../controllers/trip.controller.js';
import { validateCreateTrip, validateCompleteTrip } from '../validators/trip.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST, Role.DRIVER),
  tripController.getTrips
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER),
  validateCreateTrip,
  tripController.createTrip
);

router.post(
  '/:id/dispatch',
  authorize(Role.FLEET_MANAGER),
  tripController.dispatchTrip
);

router.post(
  '/:id/complete',
  authorize(Role.FLEET_MANAGER, Role.DRIVER),
  validateCompleteTrip,
  tripController.completeTrip
);

router.post(
  '/:id/cancel',
  authorize(Role.FLEET_MANAGER),
  tripController.cancelTrip
);

export default router;