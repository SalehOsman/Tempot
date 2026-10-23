import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function createDatabaseClient(options: { databaseUrl: string }) {
  const pool = new pg.Pool({ connectionString: options.databaseUrl });
  return drizzle(pool);
}
