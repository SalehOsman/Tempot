import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemaPath = new URL('../../prisma/schema.prisma', import.meta.url);
const baseSchemaPath = new URL('../../prisma/base.prisma', import.meta.url);
const migrationPath = new URL(
  '../../prisma/migrations/20260723000000_add_user_profile_status/migration.sql',
  import.meta.url,
);

describe('UserProfile status schema', () => {
  it('persists account status on the UserProfile model', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    const baseSchema = readFileSync(baseSchemaPath, 'utf-8');

    expect(schema).toContain('status     String  @default("ACTIVE")');
    expect(baseSchema).toContain('status     String  @default("ACTIVE")');
  });

  it('commits a deployable migration for account status changes', () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migrationSql = readFileSync(migrationPath, 'utf-8');
    expect(migrationSql).toContain(
      'ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'ACTIVE\'',
    );
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS "UserProfile_status_idx"');
  });
});
