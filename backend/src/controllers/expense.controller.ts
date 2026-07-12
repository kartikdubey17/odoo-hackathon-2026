import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service.js';

export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;

    const result = await expenseService.getExpenses({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.createExpense(req.body);
    return res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}
