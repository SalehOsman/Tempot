import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { monetaryColumn } from '@tembot/db-kernel';

/**
 * Sovereign AI Telemetry & Cost Accounting Schema.
 * Tracks System One (jev) & System Two (Generative) executions.
 * Strictly adheres to Taboo 3 (No floating point money - uses NUMERIC 24, 8).
 */
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  actorId: text('actor_id').notNull(),
  tier: text('tier').$type<'SYSTEM_ONE' | 'SYSTEM_TWO'>().notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').default(0).notNull(),
  completionTokens: integer('completion_tokens').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  costUsd: monetaryColumn('cost_usd').default('0').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  keyId: text('key_id'),
  fallbackOccurred: boolean('fallback_occurred').default(false).notNull(),
  status: text('status').$type<'SUCCESS' | 'RATE_LIMITED' | 'FAILED'>().default('SUCCESS').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AiUsageLogRecord = typeof aiUsageLogs.$inferSelect;
export type NewAiUsageLogRecord = typeof aiUsageLogs.$inferInsert;
