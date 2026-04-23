import type { Result } from 'neverthrow';
import type { AppError, AsyncResult } from '@tempot/shared';

/** Cache adapter interface used by SessionProvider. */
export interface CacheAdapter {
  get: <T>(key: string) => Promise<Result<T | null, AppError>>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<Result<void, AppError>>;
  del: (key: string) => Promise<Result<void, AppError>>;
  /** Extends the TTL of a key without reading or overwriting its value. */
  expire: (key: string, ttl: number) => Promise<Result<void, AppError>>;
}

/** Payload published when a session is updated via the event bus. */
export interface SessionUpdatedPayload {
  userId: string;
  chatId: string;
  sessionData: unknown;
}

/** Payload published when Redis is degraded (Rule XXXII). */
export interface SessionRedisDegradedPayload {
  operation: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

/** Event bus adapter interface used by SessionProvider. */
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
  repository: import('./session.repository.js').SessionRepository;
  /** Optional logger; required for Rule XXXII SUPER_ADMIN degradation alerts. */
  logger?: { error: (data: Record<string, unknown>) => void };
}
