import * as fs from 'node:fs';
import * as path from 'node:path';
import { createChildLogger } from '@tembot/logger';
import { createBot } from './bot.js';

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

const logger = createChildLogger({ module: 'app-bot', slice: 'runner' });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'your_telegram_bot_token_here') {
  logger.warn(
    'TELEGRAM_BOT_TOKEN is not configured in environment or .env. Please configure your bot token to start polling.',
  );
  process.exit(0);
}

const tmaUrl = process.env.TMA_URL ?? 'http://localhost:5173';
const bot = createBot(token, { tmaUrl });

logger.info('Starting Tembot in Long Polling mode (Local Development)...');

bot.start({
  onStart: (botInfo) => {
    logger.info(
      { botId: botInfo.id, username: botInfo.username },
      `Tembot @${botInfo.username} is online and actively polling updates!`,
    );
  },
});

// Graceful termination handling
const shutdown = () => {
  logger.info('Stopping Telegram bot polling gracefully...');
  bot.stop();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
