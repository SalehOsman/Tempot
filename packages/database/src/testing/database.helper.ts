import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const PGVECTOR_TEST_IMAGE = 'pgvector/pgvector:0.8.2-pg16';

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
  private usingExternalDb = false;

  async start() {
    const externalUrl = process.env.DATABASE_URL;

    if (externalUrl) {
      // CI mode — use pre-provisioned database (e.g. GitHub Actions service container)
      this.usingExternalDb = true;
      this.pool = new Pool({ connectionString: externalUrl });
    } else {
      // Local mode — start a testcontainer with pgvector support
      this.container = await new PostgreSqlContainer(PGVECTOR_TEST_IMAGE).start();
      const url = this.container.getConnectionUri();
      process.env.DATABASE_URL = url;
      this.pool = new Pool({ connectionString: url });
    }

    // Enable pgvector extension explicitly
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // PrismaPg expects its own bundled @types/pg Pool type (8.11.11),
    // which conflicts with our @types/pg (8.20.0). Structurally compatible at runtime.
    const adapter = new PrismaPg(this.pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
    this.prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
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
  }
}
