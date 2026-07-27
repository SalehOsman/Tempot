import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemaPath = new URL('../../prisma/schema.prisma', import.meta.url);
const baseSchemaPath = new URL('../../prisma/base.prisma', import.meta.url);
const migrationPath = new URL(
  '../../prisma/migrations/20260727000000_add_backup_management_metadata/migration.sql',
  import.meta.url,
);

describe('backup management metadata schema', () => {
  it('persists backup jobs, artifacts, and restore rehearsals in Prisma schema', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    const baseSchema = readFileSync(baseSchemaPath, 'utf-8');

    expect(schema).toContain('model BackupJob');
    expect(schema).toContain('model BackupArtifact');
    expect(schema).toContain('model RestoreRehearsal');
    expect(baseSchema).toContain('model BackupJob');
    expect(baseSchema).toContain('model BackupArtifact');
    expect(baseSchema).toContain('model RestoreRehearsal');
  });

  it('commits a deployable migration for backup metadata tables', () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migrationSql = readFileSync(migrationPath, 'utf-8');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "backup_jobs"');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "backup_artifacts"');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "restore_rehearsals"');
    expect(migrationSql).toContain('idx_backup_jobs_status_requested');
  });
});
