import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, 'vehicleId is required').optional(),
  tripId: z.string().min(1, 'tripId is required'),
  type: z.string().min(1, 'type is required'),
  amount: z.number().gt(0, 'amount must be greater than 0'),
  date: z.coerce.date(),
});

export function validateCreateExpense(req: Request, res: Response, next: NextFunction) {
  const result = createExpenseSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}
