import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.utils';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    (req as AuthRequest).user = payload;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is a company admin or higher
 */
export const requireCompanyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthRequest).user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  if (!['admin', 'company_admin'].includes(user.role)) {
    res.status(403).json({
      success: false,
      message: 'Company admin access required',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is a super admin
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthRequest).user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  if (user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Super admin access required',
    });
    return;
  }

  next();
};
