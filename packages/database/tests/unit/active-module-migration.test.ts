import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../../prisma/migrations/20260718000000_reconcile_active_module_schema/migration.sql',
  import.meta.url,
);

describe('active module schema reconciliation migration', () => {
  it('commits missing user profile fields and active module tables', () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migrationSql = readFileSync(migrationPath, 'utf-8');

    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS "gender" TEXT');
    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS "governorate" TEXT');
    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT \'+20\'');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "membership_requests"');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "templates"');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "managed_bots"');
    expect(migrationSql).toContain('membership_requests_one_pending_per_telegram');
  });
});
