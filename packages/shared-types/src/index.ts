export * from './result.js';
export * from './errors.js';

export interface ActorIdentity {
  readonly id: string;
  readonly type: 'telegram_user' | 'operator' | 'system_worker';
  readonly capabilities: readonly string[];
  readonly tenantId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

export interface ClockProvider {
  now(): Date;
  nowIso(): string;
  nowEpoch(): number;
}
