import { auditTimestamps, multiTenancyColumns, softDeleteColumns } from '@tembot/db-kernel';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Sovereign Operators Schema.
 * Operators are administrative and management users of the platform (Dashboard & Tools).
 */
export const operators = pgTable('operators', {
  id: uuid('id').defaultRandom().primaryKey(),
  ...multiTenancyColumns,

  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  roleSlug: text('role_slug').default('OperationsManager').notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  ...auditTimestamps,
  ...softDeleteColumns,
});

export type OperatorRecord = typeof operators.$inferSelect;
export type NewOperatorRecord = typeof operators.$inferInsert;

/**
 * Sovereign Operator Sessions Schema.
 * Tracks active, expired, and revoked operator sessions.
 * Never store plaintext tokens; only store cryptographic SHA-256 hashes of session tokens.
 */
export const operatorSessions = pgTable('operator_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ...multiTenancyColumns,

  operatorId: uuid('operator_id')
    .notNull()
    .references(() => operators.id),
  sessionTokenHash: text('session_token_hash').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OperatorSessionRecord = typeof operatorSessions.$inferSelect;
export type NewOperatorSessionRecord = typeof operatorSessions.$inferInsert;

/**
 * Sovereign Role Profiles Schema.
 * Dynamic aggregation of fine-grained atomic capabilities assigned to actors.
 */
export const roleProfiles = pgTable('role_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  ...multiTenancyColumns,

  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  capabilities: text('capabilities').array().notNull(),
  isSystem: boolean('is_system').default(false).notNull(),

  ...auditTimestamps,
  ...softDeleteColumns,
});

export type RoleProfileRecord = typeof roleProfiles.$inferSelect;
export type NewRoleProfileRecord = typeof roleProfiles.$inferInsert;
