export interface OutboxPayload {
  readonly eventName: string;
  readonly aggregateId: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly tenantId?: string;
}

export interface PreparedOutboxRecord {
  readonly id: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly payload: string; // JSON stringified for PostgreSQL JSONB
  readonly status: 'PENDING';
  readonly retryCount: number;
  readonly createdAt: string;
  readonly tenantId?: string;
}

/**
 * Creates an immutable outbox record ready to be inserted atomically inside a database transaction.
 */
export function createOutboxEvent(event: OutboxPayload): PreparedOutboxRecord {
  return {
    id: crypto.randomUUID(),
    eventName: event.eventName,
    aggregateId: event.aggregateId,
    payload: JSON.stringify(event.payload),
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    tenantId: event.tenantId,
  };
}
