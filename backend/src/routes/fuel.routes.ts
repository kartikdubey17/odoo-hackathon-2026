import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as fuelController from '../controllers/fuel.controller.js';
import { validateCreateFuelLog } from '../validators/fuel.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST),
  fuelController.getFuelLogs
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER),
  validateCreateFuelLog,
  fuelController.createFuelLog
);

export default router;
