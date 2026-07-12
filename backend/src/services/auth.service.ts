import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { signToken } from '../utils/jwt';

export class AuthError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AuthError('INVALID_CREDENTIALS', 401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AuthError('INVALID_CREDENTIALS', 401, 'Invalid email or password');

  const token = signToken({ userId: user.id, role: user.role });

  const { passwordHash, ...safeUser } = user;
  return { token, user: safeUser };
}
