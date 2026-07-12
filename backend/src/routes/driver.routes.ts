import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as driverController from '../controllers/driver.controller.js';
import { validateCreateDriver, validateUpdateDriver } from '../validators/driver.validation.js';
const router = Router();

router.use(authenticate);

router.get(
  '/available',
  authorize(Role.FLEET_MANAGER),
  driverController.getAvailableDrivers
);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST, Role.DRIVER),
  driverController.getDrivers
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER),
  validateCreateDriver,
  driverController.createDriver
);

router.patch(
  '/:id',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER),
  validateUpdateDriver,
  driverController.updateDriver
);

export default router;
