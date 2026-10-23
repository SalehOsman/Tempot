import * as fs from 'node:fs';
import * as path from 'node:path';
import { serve } from '@hono/node-server';
import { createDatabaseClient } from '@tembot/db-kernel';
import { createChildLogger } from '@tembot/logger';
import { AccessService } from '@tembot/module-access-control';
import { SettingsService } from '@tembot/module-system-settings';
import { createApp } from './app.js';

for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
]) {
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Ignore parsing errors
    }
  }
}

const logger = createChildLogger({ module: 'app-server', slice: 'main' });

const port = Number(process.env.PORT ?? 4000);
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/tembot';
const db = createDatabaseClient({ databaseUrl });
// biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container
const accessService = new AccessService(db as any);
// biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container
const settingsService = new SettingsService(db as any);
const botToken = process.env.TELEGRAM_BOT_TOKEN;

const app = createApp({
  accessService,
  settingsService,
  botToken,
});

logger.info({ port }, 'Starting Tembot Ingress API Gateway...');

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info({ port: info.port, address: info.address }, 'Tembot API Gateway listening');
  },
);
