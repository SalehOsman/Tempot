import * as crypto from 'node:crypto';
import { createChildLogger } from '@tembot/logger';
import type { AuditService } from '@tembot/module-audit-log';
import type { ActorIdentity } from '@tembot/shared-types';
import { and, eq, isNull } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { type Result, err, ok } from 'neverthrow';
import { type OperatorRecord, operatorSessions, operators, roleProfiles } from '../db/schema.js';
import {
  AccessError,
  type OperatorLoginInput,
  STANDARD_ROLE_CAPABILITIES,
  type SessionAuthResult,
  type StandardRole,
} from '../domain/types.js';

const accessLogger = createChildLogger({ module: 'access-control', slice: 'service' });

export interface AccessServiceConfig {
  readonly sessionTtlMs?: number; // Session TTL in ms (default: 86,400,000ms = 24h)
}

/**
 * Sovereign Access Control & Operator Session Service.
 * Implements the Zero-Role Engine: Code checks capabilities, never roles.
 */
export class AccessService {
  private readonly sessionTtlMs: number;

  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container
    private readonly db: PgDatabase<any>,
    private readonly auditService?: AuditService,
    config: AccessServiceConfig = {},
  ) {
    this.sessionTtlMs = config.sessionTtlMs ?? 24 * 60 * 60 * 1000;
  }

  /**
   * Hashes a password securely using Node.js native scrypt.
   * Format: salt:hash
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies a password against a stored salt:hash string using timing-safe comparison.
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);

    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  /**
   * Evaluates if a given set of capabilities satisfies the required capability.
   * Supports:
   * 1. Universal Wildcard: '*' grants all capabilities (SuperAdmin).
   * 2. Namespace Wildcards: e.g., 'settings:*' satisfies 'settings:read' and 'settings:write'.
   * 3. Exact Capability Match: 'settings:read' satisfies 'settings:read'.
   */
  static can(actorCapabilities: readonly string[], requiredCapability: string): boolean {
    if (actorCapabilities.includes('*')) return true;
    if (actorCapabilities.includes(requiredCapability)) return true;

    // Namespace wildcard check: e.g. required 'settings:read' matches 'settings:*'
    const parts = requiredCapability.split(':');
    if (parts.length > 1) {
      const namespaceWildcard = `${parts[0]}:*`;
      if (actorCapabilities.includes(namespaceWildcard)) return true;
    }

    return false;
  }

  /**
   * Authenticates an operator using email and password, establishing a cryptographically
   * tracked session.
   */
  async login(input: OperatorLoginInput): Promise<Result<SessionAuthResult, AccessError>> {
    try {
      const foundOperators = await this.db
        .select()
        .from(operators)
        .where(
          and(
            eq(operators.tenantId, input.tenantId),
            eq(operators.email, input.email.toLowerCase()),
            isNull(operators.deletedAt),
          ),
        )
        .limit(1);

      if (foundOperators.length === 0) {
        return err(new AccessError('INVALID_CREDENTIALS', 'Invalid email or password', 401));
      }

      const operator: OperatorRecord = foundOperators[0];

      if (!operator.isActive) {
        return err(
          new AccessError(
            'OPERATOR_INACTIVE',
            'Operator account is deactivated by administrator',
            403,
          ),
        );
      }

      const isPasswordValid = AccessService.verifyPassword(input.password, operator.passwordHash);
      if (!isPasswordValid) {
        return err(new AccessError('INVALID_CREDENTIALS', 'Invalid email or password', 401));
      }

      // Resolve capabilities for operator's role
      const capabilities = await this.resolveRoleCapabilities(
        operator.tenantId ?? input.tenantId,
        operator.roleSlug,
      );

      // Generate cryptographically secure random session token (32 bytes)
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
      const expiresAt = new Date(Date.now() + this.sessionTtlMs);

      await this.db.insert(operatorSessions).values({
        tenantId: operator.tenantId ?? input.tenantId,
        operatorId: operator.id,
        sessionTokenHash,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt,
      });

      const actor: ActorIdentity = {
        id: operator.id,
        type: 'operator',
        tenantId: operator.tenantId ?? input.tenantId,
        capabilities,
      };

      if (this.auditService) {
        await this.auditService.record({
          tenantId: operator.tenantId ?? input.tenantId,
          actorId: operator.id,
          actorType: 'admin',
          action: 'auth.login.success',
          entityType: 'operator_session',
          entityId: operator.id,
          payload: { email: operator.email, ipAddress: input.ipAddress },
        });
      }

      accessLogger.info(
        { operatorId: operator.id, email: operator.email },
        'Operator authenticated successfully',
      );

      return ok({
        sessionToken,
        actor,
        expiresAt,
      });
    } catch (error) {
      accessLogger.error({ error, email: input.email }, 'Operator authentication failed');
      return err(
        new AccessError('DATABASE_ERROR', 'Failed to authenticate operator in database', 500, {
          originalError: String(error),
        }),
      );
    }
  }

  /**
   * Verifies a session token against stored active sessions.
   */
  async verifySession(sessionToken: string): Promise<Result<ActorIdentity, AccessError>> {
    try {
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

      const sessions = await this.db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionTokenHash, sessionTokenHash))
        .limit(1);

      if (sessions.length === 0) {
        return err(new AccessError('SESSION_NOT_FOUND', 'Session token is not recognized', 401));
      }

      const session = sessions[0];

      if (session.revokedAt) {
        return err(new AccessError('SESSION_REVOKED', 'Session has been revoked', 401));
      }

      if (session.expiresAt.getTime() < Date.now()) {
        return err(new AccessError('SESSION_EXPIRED', 'Session has expired', 401));
      }

      // Fetch operator details
      const foundOperators = await this.db
        .select()
        .from(operators)
        .where(and(eq(operators.id, session.operatorId), isNull(operators.deletedAt)))
        .limit(1);

      if (foundOperators.length === 0) {
        return err(new AccessError('OPERATOR_NOT_FOUND', 'Associated operator was deleted', 401));
      }

      const operator = foundOperators[0];
      if (!operator.isActive) {
        return err(new AccessError('OPERATOR_INACTIVE', 'Operator account is inactive', 403));
      }

      const capabilities = await this.resolveRoleCapabilities(
        operator.tenantId ?? '',
        operator.roleSlug,
      );

      const actor: ActorIdentity = {
        id: operator.id,
        type: 'operator',
        tenantId: operator.tenantId ?? undefined,
        capabilities,
      };

      return ok(actor);
    } catch (error) {
      return err(
        new AccessError('DATABASE_ERROR', 'Failed to verify session token', 500, {
          originalError: String(error),
        }),
      );
    }
  }

  /**
   * Revokes an active session immediately.
   */
  async revokeSession(sessionToken: string): Promise<Result<void, AccessError>> {
    try {
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

      await this.db
        .update(operatorSessions)
        .set({ revokedAt: new Date() })
        .where(eq(operatorSessions.sessionTokenHash, sessionTokenHash));

      return ok(undefined);
    } catch (error) {
      return err(
        new AccessError('DATABASE_ERROR', 'Failed to revoke session token', 500, {
          originalError: String(error),
        }),
      );
    }
  }

  /**
   * Resolves capabilities for a role slug, looking up dynamic database role profiles
   * with fallback to invariant standard role configurations.
   */
  private async resolveRoleCapabilities(
    tenantId: string,
    roleSlug: string,
  ): Promise<readonly string[]> {
    try {
      const profiles = await this.db
        .select()
        .from(roleProfiles)
        .where(
          and(
            eq(roleProfiles.tenantId, tenantId),
            eq(roleProfiles.slug, roleSlug),
            isNull(roleProfiles.deletedAt),
          ),
        )
        .limit(1);

      if (profiles.length > 0 && Array.isArray(profiles[0]?.capabilities)) {
        return profiles[0].capabilities;
      }
    } catch {
      // Fallback to static in-memory standard definitions
    }

    if (roleSlug in STANDARD_ROLE_CAPABILITIES) {
      return STANDARD_ROLE_CAPABILITIES[roleSlug as StandardRole];
    }

    return [];
  }
}
