import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./modules/**/src/db/schema.ts', './packages/db-kernel/src/outbox-table.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/tembot',
  },
  verbose: true,
  strict: true,
});
