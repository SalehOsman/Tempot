import type { ActorIdentity } from '@tembot/shared-types';

export type StandardRole = 'SuperAdmin' | 'OperationsManager' | 'Auditor' | 'EndUser';

/**
 * Invariant Role-to-Capability Defaults.
 * Enforces the Zero-Role Engine: Code checks capabilities, never roles.
 */
export const STANDARD_ROLE_CAPABILITIES: Record<StandardRole, readonly string[]> = {
  SuperAdmin: ['*'],
  OperationsManager: [
    'settings:*',
    'broadcast:*',
    'tasks:*',
    'media:*',
    'operator:manage',
    'access:manage',
  ],
  Auditor: ['audit:read', 'audit:export', 'telemetry:read', 'settings:read'],
  EndUser: ['bot:interact', 'tma:access', 'settings:read'],
};

export type AccessErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'OPERATOR_NOT_FOUND'
  | 'OPERATOR_INACTIVE'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR';

export class AccessError extends Error {
  constructor(
    public readonly code: AccessErrorCode,
    message: string,
    public readonly statusCode: number = 401,
    public readonly context?: Record<string, unknown>,
  ) {
    super(`[AccessError:${code}] ${message}`);
    this.name = 'AccessError';
  }
}

export interface OperatorLoginInput {
  readonly email: string;
  readonly password: string;
  readonly tenantId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface SessionAuthResult {
  readonly sessionToken: string;
  readonly actor: ActorIdentity;
  readonly expiresAt: Date;
}
