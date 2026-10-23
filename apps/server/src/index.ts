import { serve } from '@hono/node-server';
import { createChildLogger } from '@tembot/logger';
import { createApp } from './app.js';

const logger = createChildLogger({ module: 'app-server', slice: 'main' });

const port = Number(process.env.PORT ?? 3000);
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
