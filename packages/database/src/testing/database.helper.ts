import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { DB_CONFIG } from '../database.config.js';

const PGVECTOR_TEST_IMAGE = 'pgvector/pgvector:0.8.2-pg16';
const require = createRequire(import.meta.url);
const DATABASE_PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PRISMA_CLI_PATH = require.resolve('prisma/build/index.js');

/**
 * Utility for integration tests to provide a clean PostgreSQL + pgvector environment.
 *
 * CI-aware: when DATABASE_URL is already set (e.g. by GitHub Actions service containers),
 * connects directly without starting a testcontainer. When running locally without
 * DATABASE_URL, starts a testcontainer automatically.
 */
export class TestDB {
  private container!: StartedPostgreSqlContainer;
  public prisma!: PrismaClient;
  private pool!: Pool;
  private databaseUrl?: string;
  private previousDatabaseUrl?: string;
  private usingExternalDb = false;

  async start() {
    const externalUrl = process.env.DATABASE_URL;
    this.previousDatabaseUrl = externalUrl;

    if (externalUrl) {
      // CI mode: use pre-provisioned database.
      this.usingExternalDb = true;
      this.databaseUrl = externalUrl;
      this.pool = new Pool({ connectionString: externalUrl });
    } else {
      // Local mode: start a testcontainer with pgvector support.
      this.container = await new PostgreSqlContainer(PGVECTOR_TEST_IMAGE).start();
      const url = this.container.getConnectionUri();
      process.env.DATABASE_URL = url;
      this.databaseUrl = url;
      this.pool = new Pool({ connectionString: url });
    }

    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

    const adapter = new PrismaPg(this.pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
    this.prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  applyPrismaSchema(): void {
    execFileSync(process.execPath, [PRISMA_CLI_PATH, 'db', 'push', '--accept-data-loss'], {
      cwd: DATABASE_PACKAGE_ROOT,
      env: { ...process.env, DATABASE_URL: this.getDatabaseUrl() },
      stdio: 'pipe',
    });
  }

  async applyVectorSchema(): Promise<void> {
    const dimensions = String(DB_CONFIG.VECTOR_DIMENSIONS);

    await this.pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id text NOT NULL,
        content_type text NOT NULL,
        vector vector(${dimensions}) NOT NULL,
        metadata jsonb
      );
    `);
    await this.pool.query('DROP INDEX IF EXISTS embeddings_vector_hnsw_idx;');
    await this.pool.query(`
      CREATE INDEX embeddings_vector_hnsw_idx ON embeddings
        USING hnsw ((vector::halfvec(${dimensions})) halfvec_cosine_ops);
    `);
  }

  async stop() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.pool) {
      await this.pool.end();
    }
    if (this.container && !this.usingExternalDb) {
      await this.container.stop();
    }
    if (!this.usingExternalDb) {
      this.restoreDatabaseUrl();
    }
  }

  private getDatabaseUrl(): string {
    if (!this.databaseUrl) {
      throw new Error('TestDB.start() must be called before applying schemas.');
    }

    return this.databaseUrl;
  }

  private restoreDatabaseUrl(): void {
    if (this.previousDatabaseUrl) {
      process.env.DATABASE_URL = this.previousDatabaseUrl;
      return;
    }

    delete process.env.DATABASE_URL;
  }
}
