import { defineConfig } from 'prisma/config';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envPath = resolve(process.cwd(), '../../.env');
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

export default defineConfig({
  earlyAccess: true,
  engineType: 'library',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
