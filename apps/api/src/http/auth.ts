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

export function authenticate(db: Db): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (!match?.[1]) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak ditemukan. Silakan masuk.'));
      return;
    }
    const user = resolveSession(db, match[1]);
    if (!user) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak valid atau sudah berakhir.'));
      return;
    }
    req.authUser = user;
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
