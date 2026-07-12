import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as vehicleController from '../controllers/vehicle.controller.js';

const router = Router();

router.use(authenticate);

router.get(
  '/available',
  authorize(Role.FLEET_MANAGER),
  vehicleController.getAvailableVehicles
);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST),
  vehicleController.getVehicles
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER),
  vehicleController.createVehicle
);

router.patch(
  '/:id',
  authorize(Role.FLEET_MANAGER),
  vehicleController.updateVehicle
);

export default router;
