import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email and password are required' });
    }

    const result = await authService.login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
