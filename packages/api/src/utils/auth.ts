import jwt from 'jsonwebtoken';
import { config } from './config';

export const signToken = (userId: string): string =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });

export const verifyToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
};

export const getUserIdFromAuthHeader = (authorization?: string): string | null => {
  if (!authorization) return null;
  const token = authorization.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
};
