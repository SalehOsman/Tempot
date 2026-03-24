import { Result, ok, err } from 'neverthrow';
import { Session, ISessionProvider } from './types';
import { AppError } from '@tempot/shared';
import { SessionRepository } from './repository';

/** Cache adapter interface used by SessionProvider. */
export interface CacheAdapter {
  get: <T>(key: string) => Promise<Result<T | null, AppError>>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<Result<void, AppError>>;
  del: (key: string) => Promise<Result<void, AppError>>;
}

/** Event bus adapter interface used by SessionProvider. */
export interface EventBusAdapter {
  publish: (eventName: string, payload: unknown) => Promise<Result<void, AppError>>;
}

/** Dependencies injected into SessionProvider. */
export interface SessionProviderDeps {
  cache: CacheAdapter;
  eventBus: EventBusAdapter;
  repository: SessionRepository;
  /** Optional logger; required for Rule XXXII SUPER_ADMIN degradation alerts. */
  logger?: { error: (data: object) => void };
}

/**
 * Dual-layer session provider: Redis primary with PostgreSQL fallback.
 *
 * Implements Rule XXXII — any Redis failure triggers a SUPER_ADMIN degradation alert
 * before transparently falling back to the repository.
 */
export class SessionProvider implements ISessionProvider {
  private readonly DEFAULT_TTL = 86400; // 24 hours in seconds

  constructor(private deps: SessionProviderDeps) {}

  private alertDegradation(operation: string, error: AppError): void {
    this.deps.logger?.error({
      code: 'SYSTEM_DEGRADATION',
      payload: { target: 'SUPER_ADMIN', operation, error: error.message },
    });
  }

  private getSessionKey(userId: string, chatId: string): string {
    return `session:${userId}:${chatId}`;
  }

  /**
   * Reads the session from Redis; on cache miss or failure falls back to PostgreSQL.
   * Each successful cache hit resets the 24h sliding TTL.
   */
  async getSession(userId: string, chatId: string): Promise<Result<Session, AppError>> {
    const key = this.getSessionKey(userId, chatId);

    // 1. Try Cache
    const cachedResult = await this.deps.cache.get<Session>(key);

    if (cachedResult.isErr()) {
      // Rule XXXII: Redis failure → alert SUPER_ADMIN, fall back to repository
      this.alertDegradation('getSession', cachedResult.error);
    } else if (cachedResult.value) {
      const session = cachedResult.value;
      // Sliding TTL: Extend expiration on each interaction
      await this.deps.cache.set(key, session, this.DEFAULT_TTL);
      return ok(session);
    }

    // 2. Try Repository (Fallback)
    const id = `${userId}:${chatId}`;
    const repoResult = await this.deps.repository.findById(id);

    if (repoResult.isOk()) {
      const session = repoResult.value;
      // Sync back to cache
      await this.deps.cache.set(key, session, this.DEFAULT_TTL);
      return ok(session as unknown as Session);
    }

    // If both fail or not found — narrow to Result<Session, AppError>
    return err(repoResult.error);
  }

  /**
   * Writes the session to Redis (incrementing `version` for OCC) then publishes
   * a `session-manager.session.updated` event for async PostgreSQL sync via BullMQ.
   */
  async saveSession(session: Session): Promise<Result<void, AppError>> {
    const key = this.getSessionKey(session.userId, session.chatId);

    // Increment version for OCC
    const updatedSession = {
      ...session,
      version: session.version + 1,
      updatedAt: new Date(),
    };

    // 1. Save to Cache
    const cacheResult = await this.deps.cache.set(key, updatedSession, this.DEFAULT_TTL);
    if (cacheResult.isErr()) {
      // Rule XXXII: Redis failure → alert SUPER_ADMIN, continue to ensure persistence via event bus
      this.alertDegradation('saveSession', cacheResult.error);
    }

    // 2. Publish Event for async sync to Postgres
    await this.deps.eventBus.publish('session-manager.session.updated', {
      userId: session.userId,
      chatId: session.chatId,
      sessionData: updatedSession,
    });

    return ok(undefined);
  }

  /** Removes the session from both Redis and PostgreSQL. */
  async deleteSession(userId: string, chatId: string): Promise<Result<void, AppError>> {
    const key = this.getSessionKey(userId, chatId);
    const id = `${userId}:${chatId}`;

    await this.deps.cache.del(key);
    return this.deps.repository.delete(id);
  }
}
