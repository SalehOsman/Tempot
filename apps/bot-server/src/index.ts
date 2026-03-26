/**
 * [PROTOTYPE - WILL NOT ENTER PRODUCTION]
 *
 * WARNING: This file currently violates several constitutional rules:
 * - Rule XXXIX (i18n-Only): Contains hardcoded English strings.
 * - Rule XXV (Security by Default): Lacks CASL, Ratelimiter, and Zod layers.
 *
 * This minimal implementation exists SOLELY to test the Telegram bot connection
 * before the core infrastructure packages are built.
 * IT MUST BE DELETED AND REWRITTEN as soon as the core packages (logger, i18n, etc.) are ready.
 */

// To run: pnpm dev (from root)

import { Bot } from 'grammy';

const token = process.env.BOT_TOKEN;

if (!token) {
  process.stderr.write('BOT_TOKEN is missing — add it to your .env file\n');
  process.exit(1);
}

const bot = new Bot(token);

bot.command('start', (ctx) => {
  return ctx.reply(
    'Tempot is connected!\n\n' +
      'Bot is running in minimal mode.\n' +
      'No database or Redis required at this stage.',
  );
});

bot.command('ping', (ctx) => {
  return ctx.reply('Pong!');
});

bot.on('message', (ctx) => {
  return ctx.reply(`Echo: ${ctx.message.text ?? '(non-text message)'}`);
});

bot.catch((err) => {
  process.stderr.write(
    JSON.stringify({
      level: 'error',
      module: 'bot-server',
      message: 'Bot error',
      error: err.message,
    }) + '\n',
  );
});

process.stderr.write('Starting Tempot bot in minimal mode...\n');

bot.start({
  onStart: (info) => {
    process.stderr.write(`Bot connected: @${info.username}\n`);
    process.stderr.write('Listening for messages... (Ctrl+C to stop)\n');
  },
});

// Basic graceful shutdown (Partial compliance with Rule XVII)
const stopRunner = () => {
  process.stderr.write('Stopping bot gracefully...\n');
  bot.stop().then(() => {
    process.stderr.write('Bot stopped.\n');
    process.exit(0);
  });
};

process.once('SIGINT', stopRunner);
process.once('SIGTERM', stopRunner);
