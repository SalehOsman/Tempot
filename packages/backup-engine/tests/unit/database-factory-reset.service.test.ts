import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { DatabaseFactoryResetService } from '../../src/index.js';

describe('DatabaseFactoryResetService', () => {
  it('should reset the public schema and reapply database migrations', async () => {
    const runner = { run: vi.fn(async () => ok(undefined)) };
    const service = new DatabaseFactoryResetService({ runner });

    const result = await service.resetDatabase({
      confirmedBy: 'super-admin-1',
      databaseUrl: 'postgresql://tempot:secret@postgres:5432/tempot_db',
      preResetBackupJobId: 'backup-before-reset',
      prismaCliPath: '/app/node_modules/.pnpm/node_modules/.bin/prisma',
      prismaSchemaPath: '/app/node_modules/@tempot/database/prisma/schema.prisma',
      prismaWorkingDirectory: '/app/node_modules/@tempot/database',
    });

    expect(result.isOk()).toBe(true);
    expect(runner.run).toHaveBeenNthCalledWith(
      1,
      'psql',
      expect.arrayContaining([
        '--dbname=postgresql://tempot:secret@postgres:5432/tempot_db',
        '--command=DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;',
      ]),
    );
    expect(runner.run).toHaveBeenNthCalledWith(
      2,
      '/app/node_modules/.pnpm/node_modules/.bin/prisma',
      ['migrate', 'deploy', '--schema=/app/node_modules/@tempot/database/prisma/schema.prisma'],
      { cwd: '/app/node_modules/@tempot/database' },
    );
    expect(result._unsafeUnwrap()).toMatchObject({
      confirmedBy: 'super-admin-1',
      preResetBackupJobId: 'backup-before-reset',
      status: 'succeeded',
    });
  });
});
