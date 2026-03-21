import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Utility for integration tests to provide a clean PostgreSQL + pgvector environment
 */
export class TestDB {
  private container!: StartedPostgreSqlContainer;
  public prisma!: PrismaClient;
  private pool!: Pool;

  async start() {
    // Start PostgreSQL with pgvector support
    this.container = await new PostgreSqlContainer('ankane/pgvector:latest').start();
    const url = this.container.getConnectionUri();

    process.env.DATABASE_URL = url;

    // Setup adapter-pg for Prisma 7
    this.pool = new Pool({ connectionString: url });

    // Enable pgvector extension explicitly
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

    const adapter = new PrismaPg(this.pool);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    this.prisma = new PrismaClient({ adapter } as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  async stop() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.pool) {
      await this.pool.end();
    }
    if (this.container) {
      await this.container.stop();
    }
  }
}
