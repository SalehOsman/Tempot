import { numeric, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Audit timestamp columns enforcing timezone awareness (timestamptz).
 */
export const auditTimestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/**
 * Soft delete columns enforcing the Zero Hard Deletes Invariant.
 */
export const softDeleteColumns = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * Multi-tenancy column for SaaS tenant isolation.
 */
export const multiTenancyColumns = {
  tenantId: uuid('tenant_id'),
};

/**
 * Standard monetary column enforcing arbitrary-precision math (NUMERIC 24, 8).
 * Never use IEEE 754 floating point numbers for financial values.
 */
export function monetaryColumn(name = 'amount') {
  return numeric(name, { precision: 24, scale: 8 });
}
