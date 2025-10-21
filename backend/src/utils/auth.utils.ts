import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT token utilities
interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;
  return jwt.sign(payload, refreshSecret, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;
    const decoded = jwt.verify(token, refreshSecret);
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
