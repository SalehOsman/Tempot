import { prisma } from '@tempot/database';

import {
  collectSensitiveDataInventory,
  type ReadonlyQueryClient,
} from './sensitive-data-inventory.js';

async function run(): Promise<void> {
  try {
    const report = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const client: ReadonlyQueryClient = {
        query: async (sql) => (await tx.$queryRawUnsafe(sql)) as readonly Record<string, unknown>[],
      };
      return collectSensitiveDataInventory(client);
    });

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch {
    process.stderr.write(
      `${JSON.stringify({
        code: 'security.sensitive_data_inventory_failed',
        message: 'The read-only sensitive-data inventory could not be completed.',
      })}\n`,
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await run();
