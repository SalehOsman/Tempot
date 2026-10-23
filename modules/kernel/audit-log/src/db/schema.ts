import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Sovereign Append-Only Forensic Audit Trail Schema.
 * Invariant: Audit records can NEVER be updated or deleted.
 * Cryptographic SHA-256 hash chaining ensures tamper detection.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  traceId: text('trace_id'),
  actorId: text('actor_id').notNull(),
  actorType: text('actor_type').$type<'user' | 'admin' | 'system' | 'cron'>().notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  status: text('status').$type<'SUCCESS' | 'FAILURE' | 'REJECTED'>().default('SUCCESS').notNull(),
  payload: jsonb('payload').default({}).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  errorDetails: jsonb('error_details'),
  previousHash: text('previous_hash').notNull(),
  hash: text('hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLogRecord = typeof auditLogs.$inferSelect;
export type NewAuditLogRecord = typeof auditLogs.$inferInsert;
