import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

/**
 * Utility for integration tests to provide a clean PostgreSQL + pgvector environment
 */
export class TestDB {
  private container!: StartedPostgreSqlContainer;
  public prisma!: PrismaClient;

  async start() {
    // Start PostgreSQL with pgvector support
    this.container = await new PostgreSqlContainer('ankane/pgvector:latest').start();
    const url = this.container.getConnectionString();

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = url;

    // Note: Migrations will be run here once we have a schema
    // execSync('pnpm prisma migrate deploy', { env: process.env, stdio: 'inherit' });

    this.prisma = new PrismaClient();
  }

  async stop() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    if (this.container) {
      await this.container.stop();
    }
  }
}
