import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AdminPayload {
  role: 'admin';
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export function generateAdminToken(email: string = config.adminEmail): string {
  return jwt.sign(
    {
      role: 'admin',
      sub: 'saint-sysadmin-node-1',
      email,
    },
    config.jwtSecret,
    { expiresIn: '8h' }
  );
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  // Read from HTTP-only cookie first, then Authorization header
  const token = req.cookies?.saint_admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: '[UNAUTHORIZED]',
      message: 'Access denied: Admin credentials or valid tactical JWT required.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AdminPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: '[FORBIDDEN]',
        message: 'Security breach: Non-administrative role detected.',
      });
      return;
    }
    (req as any).adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: '[SESSION_EXPIRED]',
      message: 'Invalid or expired administrative token. Re-authentication required.',
    });
  }
}
