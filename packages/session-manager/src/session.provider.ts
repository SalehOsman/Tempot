import { Result, ok, err } from 'neverthrow';
import { Session, ISessionProvider } from './session.types.js';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { SessionRepository } from './session.repository.js';
import { SessionMemoryStore } from './session.memory-store.js';
import { migrateSession } from './session.migrator.js';
import { DEFAULT_SESSION_TTL } from './session.constants.js';
import { sessionToggle } from './session.toggle.js';

/** Cache adapter interface used by SessionProvider. */
export interface CacheAdapter {
  get: <T>(key: string) => Promise<Result<T | null, AppError>>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<Result<void, AppError>>;
  del: (key: string) => Promise<Result<void, AppError>>;
  /** Extends the TTL of a key without reading or overwriting its value. */
  expire: (key: string, ttl: number) => Promise<Result<void, AppError>>;
}

/** Event bus adapter interface used by SessionProvider. */
export interface SessionUpdatedPayload {
  userId: string;
  chatId: string;
  sessionData: unknown;
}

export interface SessionRedisDegradedPayload {
  operation: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface EventBusAdapter {
  publish(
    eventName: 'session-manager.session.updated',
    payload: SessionUpdatedPayload,
  ): AsyncResult<void, AppError>;
  publish(
    eventName: 'session.redis.degraded',
    payload: SessionRedisDegradedPayload,
  ): AsyncResult<void, AppError>;
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

/** Dependencies injected into SessionProvider. */
export interface SessionProviderDeps {
  cache: CacheAdapter;
  eventBus: EventBusAdapter;
  repository: SessionRepository;
  /** Optional logger; required for Rule XXXII SUPER_ADMIN degradation alerts. */
  logger?: { error: (data: Record<string, unknown>) => void };
}

/**
 * Dual-layer session provider: Redis primary with in-memory fallback (Rule XXXII).
 *
 * On Redis failure, sessions are temporarily stored in-memory.
 * PostgreSQL remains the async persistence target via event bus.
 */
export class SessionProvider implements ISessionProvider {
  private readonly memoryStore = new SessionMemoryStore();

  constructor(private deps: SessionProviderDeps) {}

  private alertDegradation(operation: string, error: AppError): void {
    this.deps.logger?.error({
      code: 'session.system_degradation',
      payload: { target: 'SUPER_ADMIN', operation, error: error.message },
    });

    // Rule XV + XXXII: publish degradation event for SUPER_ADMIN alerting.
    // Best-effort — if eventBus also fails, we already logged above.
    void this.deps.eventBus
      .publish('session.redis.degraded', {
        operation,
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        /* best-effort: eventBus may also be unavailable */
      });
  }

  private getSessionKey(userId: string, chatId: string): string {
    return `session:${userId}:${chatId}`;
  }

  /**
   * Reads the session from Redis; on cache failure falls back to in-memory store (Rule XXXII).
   * Each successful cache hit resets the sliding TTL via EXPIRE.
   */
  async getSession(userId: string, chatId: string): Promise<Result<Session, AppError>> {
    const disabled = sessionToggle.check();
    if (disabled) return disabled;

    const key = this.getSessionKey(userId, chatId);

    // 1. Try Cache (Redis)
    const cachedResult = await this.deps.cache.get<Session>(key);

    if (cachedResult.isErr()) {
      // Rule XXXII: Redis failure → alert SUPER_ADMIN, fall back to in-memory
      this.alertDegradation('getSession', cachedResult.error);
      const memSession = this.memoryStore.get(key);
      if (memSession) return ok(memSession);
    } else if (cachedResult.value) {
      const session = cachedResult.value;
      const expireResult = await this.deps.cache.expire(key, DEFAULT_SESSION_TTL);
      if (expireResult.isErr()) {
        this.alertDegradation('expire', expireResult.error);
      }
      return ok(session);
    }

    // 2. Try Repository (PostgreSQL — async persistence source)
    const id = `${userId}:${chatId}`;
    const repoResult = await this.deps.repository.findById(id);

    if (repoResult.isOk()) {
      const migrationResult = migrateSession(repoResult.value as unknown as Session);
      if (migrationResult.isErr()) {
        return err(migrationResult.error);
      }
      const session = migrationResult.value;
      // Sync migrated session back to cache
      const syncResult = await this.deps.cache.set(key, session, DEFAULT_SESSION_TTL);
      if (syncResult.isErr()) {
        this.alertDegradation('set', syncResult.error);
        // Rule XXXII: Also store in memory as fallback
        this.memoryStore.set(key, session);
      }
      return ok(session);
    }

    return err(repoResult.error);
  }

  /**
   * Writes the session to Redis (incrementing `version` for OCC) then publishes
   * a `session-manager.session.updated` event for async PostgreSQL sync via BullMQ.
   * On Redis failure, stores in memory (Rule XXXII).
   */
  async saveSession(session: Session): Promise<Result<void, AppError>> {
    const disabled = sessionToggle.check();
    if (disabled) return disabled;

    const key = this.getSessionKey(session.userId, session.chatId);

    // Increment version for OCC
    const updatedSession = {
      ...session,
      version: session.version + 1,
      updatedAt: new Date(),
    };

    // 1. Save to Cache
    const cacheResult = await this.deps.cache.set(key, updatedSession, DEFAULT_SESSION_TTL);
    if (cacheResult.isErr()) {
      // Rule XXXII: Redis failure → alert + in-memory fallback
      this.alertDegradation('saveSession', cacheResult.error);
      this.memoryStore.set(key, updatedSession);
    }

    // 2. Publish Event for async sync to Postgres
    const publishResult = await this.deps.eventBus.publish('session-manager.session.updated', {
      userId: session.userId,
      chatId: session.chatId,
      sessionData: updatedSession,
    });
    if (publishResult.isErr()) {
      this.alertDegradation('publish', publishResult.error);
    }

    return ok(undefined);
  }

  /** Delegates to the standalone migrateSession utility (satisfies ISessionProvider contract). */
  migrateSession(session: Session) {
    const disabled = sessionToggle.check();
    if (disabled) return disabled;

    return migrateSession(session);
  }

  /** Removes the session from Redis, in-memory store, and PostgreSQL. */
  async deleteSession(userId: string, chatId: string): Promise<Result<void, AppError>> {
    const disabled = sessionToggle.check();
    if (disabled) return disabled;

    const key = this.getSessionKey(userId, chatId);
    const id = `${userId}:${chatId}`;

    // Clean up in-memory fallback store
    this.memoryStore.del(key);

    const delResult = await this.deps.cache.del(key);
    if (delResult.isErr()) {
      // Rule XXXII: Redis failure → alert SUPER_ADMIN; still proceed to delete from DB
      this.alertDegradation('deleteSession', delResult.error);
    }

    return this.deps.repository.delete(id);
  }
}
