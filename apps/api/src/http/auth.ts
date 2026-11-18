import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Db } from '../db/index.js';
import { AppError } from './errors.js';

export type Role = 'MENTEE' | 'MENTOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/** Resolves the bearer token to a session user, or `null`. */
export function resolveSession(db: Db, token: string): AuthUser | null {
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.role, u.email_verified_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`,
    )
    .get(token) as
    { id: string; email: string; role: Role; email_verified_at: string | null } | undefined;
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, emailVerifiedAt: row.email_verified_at };
}

/**
 * Attaches the session user when the bearer token is valid. Authentication
 * failures are raised by the route itself via `requireAuth`/`requireRole`, so
 * an unknown route still returns the documented 404 instead of a 401.
 */
export function authenticate(db: Db): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    const user = match?.[1] ? resolveSession(db, match[1]) : null;
    if (user) req.authUser = user;
    next();
  };
}

export function requireAuth(req: Request): AuthUser {
  if (!req.authUser) throw new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak ditemukan.');
  return req.authUser;
}

export function requireRole(req: Request, ...roles: Role[]): AuthUser {
  const user = requireAuth(req);
  if (!roles.includes(user.role)) {
    throw new AppError(403, 'ROLE_FORBIDDEN', 'Peran Anda tidak dapat mengakses fitur ini.', {
      requiredRole: roles[0],
    });
  }
  return user;
}

export function permissionsFor(role: Role): string[] {
  switch (role) {
    case 'MENTEE':
      return ['booking:create', 'pulse:write', 'review:write', 'profile:write'];
    case 'MENTOR':
      return ['application:write', 'storefront:write', 'upgrade:write', 'mediation:write'];
    case 'ADMIN':
      return ['application:decide', 'badge:manage', 'audit:read'];
  }
}
