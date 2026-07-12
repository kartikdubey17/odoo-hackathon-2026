import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

router.use(authenticate);

router.get(
  '/summary',
  authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  reportController.getReportSummary
);

router.get(
  '/export.csv',
  authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  reportController.exportReportCsv
);

export default router;
