import * as fs from 'node:fs';
import * as path from 'node:path';
import { serve } from '@hono/node-server';
import { createChildLogger } from '@tembot/logger';
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
const app = createApp();

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
