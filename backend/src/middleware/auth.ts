import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        driverId?: string | null;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Missing or invalid Authorization header' });
    }

    const token = header.split(' ')[1];
    const payload = verifyToken(token);

    // resolve driverId for DRIVER role (needed for "own trip" ownership checks)
    let driverId: string | null = null;
    if (payload.role === Role.DRIVER) {
      const driver = await prisma.driver.findUnique({ where: { userId: payload.userId } });
      driverId = driver?.id ?? null;
    }

    req.user = { userId: payload.userId, role: payload.role, driverId };
    next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Invalid or expired token' });
  }
}
