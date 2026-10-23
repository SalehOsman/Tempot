import { isTable } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  operators,
  operatorSessions,
  roleProfiles,
} from '../../../modules/kernel/access-control/src/db/schema.js';
import { aiUsageLogs } from '../../../modules/kernel/ai-gateway/src/db/schema.js';
import { auditLogs } from '../../../modules/kernel/audit-log/src/db/schema.js';
import { systemSettings } from '../../../modules/kernel/system-settings/src/db/schema.js';
import { outboxEvents } from '../src/outbox-table.js';

/**
 * Sovereign Database Schema & Anti-Drift Sentinel Test
 * Validates INC-20261023-01 to ensure all tables conform to platform architectural invariants.
 */
describe('Sovereign Database Schema & Anti-Drift Sentinel (INC-20261023-01)', () => {
  const kernelTables = [
    { name: 'system_settings', table: systemSettings },
    { name: 'audit_logs', table: auditLogs },
    { name: 'operators', table: operators },
    { name: 'operator_sessions', table: operatorSessions },
    { name: 'role_profiles', table: roleProfiles },
    { name: 'ai_usage_logs', table: aiUsageLogs },
    { name: 'outbox_events', table: outboxEvents },
  ];

  it('guarantees that all kernel tables are valid Drizzle pgTable instances', () => {
    for (const { name, table } of kernelTables) {
      expect(isTable(table), `Entity ${name} must be a valid Drizzle table`).toBe(true);
    }
  });

  it('guarantees that every kernel table has an id primary key column', () => {
    for (const { name, table } of kernelTables) {
      const columns = getTableColumns(table);
      expect(columns.id, `Table ${name} must have an id column`).toBeDefined();
      expect(columns.id.primary, `Column id on table ${name} must be a primary key`).toBe(true);
    }
  });

  it('guarantees that audit_logs table enforces cryptographic hash fields', () => {
    const columns = getTableColumns(auditLogs);
    expect(columns.hash, 'audit_logs must have a hash column for tamper detection').toBeDefined();
    expect(
      columns.previousHash,
      'audit_logs must have a previous_hash column for hash chaining',
    ).toBeDefined();
  });
});
