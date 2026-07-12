import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as maintenanceController from '../controllers/maintenance.controller.js';
import { validateCreateMaintenance } from '../validators/maintenance.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST),
  maintenanceController.getMaintenanceLogs
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER),
  validateCreateMaintenance,
  maintenanceController.createMaintenanceLog
);

router.patch(
  '/:id/close',
  authorize(Role.FLEET_MANAGER),
  maintenanceController.closeMaintenanceLog
);

export default router;
