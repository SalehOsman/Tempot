import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import { multiTenancyColumns } from './columns.js';

/**
 * Transactional Outbox table ensuring crash-safe asynchronous event publishing.
 */
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventName: text('event_name').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').$type<'PENDING' | 'PROCESSED' | 'FAILED'>().default('PENDING').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  ...multiTenancyColumns,
});

export type OutboxEventRecord = typeof outboxEvents.$inferSelect;
export type NewOutboxEventRecord = typeof outboxEvents.$inferInsert;
