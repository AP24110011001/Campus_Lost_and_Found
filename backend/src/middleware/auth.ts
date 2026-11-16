import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { User } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      isDemoAuth?: boolean;
    }
  }
}

/**
 * Check whether Demo Mode is enabled.
 * Enabled by default unless explicitly disabled via DEMO_MODE=false or ALLOW_DEMO_AUTH=false in production.
 */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === 'false' || process.env.ALLOW_DEMO_AUTH === 'false') {
    return false;
  }
  return true;
}

/**
 * Authentication Middleware:
 * In Demo Mode, permits switching personas via `x-user-id` header or `?as_user=` query parameter.
 * IMPORTANT: If no user ID is supplied, `req.user` remains `undefined` (anonymous visitor).
 * We NEVER silently fall back to a default user.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerUserId = req.header('x-user-id');
  const queryUserId = req.query.as_user as string | undefined;
  const targetUserId = (headerUserId || queryUserId)?.trim();

  // If Demo Mode is disabled, reject mock persona headers unless a real session validator is present
  if (!isDemoMode()) {
    // In production without demo mode, header-based mock auth is strictly blocked
    req.user = undefined;
    req.isDemoAuth = false;
    return next();
  }

  req.isDemoAuth = true;

  if (!targetUserId) {
    // Truly unauthenticated visitor
    req.user = undefined;
    return next();
  }

  const user = db.prepare('SELECT id, name, email, role, avatar_color, department, created_at FROM users WHERE id = ?').get(targetUserId) as User | undefined;

  if (user) {
    req.user = user;
  } else {
    // Unknown user ID supplied - do not silently pretend they are another user
    req.user = undefined;
  }

  next();
}

/**
 * Route protection guard:
 * Rejects unauthenticated requests with a clear, honest error message.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required. Please select an active demo persona from the header dropdown to proceed.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }
  next();
}
