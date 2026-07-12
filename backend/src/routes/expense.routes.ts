import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as expenseController from '../controllers/expense.controller.js';
import { validateCreateExpense } from '../validators/expense.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST),
  expenseController.getExpenses
);

router.post(
  '/',
  authorize(Role.FLEET_MANAGER),
  validateCreateExpense,
  expenseController.createExpense
);

export default router;
