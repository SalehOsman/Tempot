// Minimal bot-server — connection test only
// No database, no Redis, no external services
// Purpose: verify BOT_TOKEN and Telegram connectivity before infrastructure setup
//
// To run: pnpm dev (from root) or pnpm dev (from apps/bot-server)
// Requires: BOT_TOKEN in .env

import { Bot } from 'grammy';

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('❌ BOT_TOKEN is missing — add it to your .env file');
  process.exit(1);
}

const bot = new Bot(token);

bot.command('start', (ctx) => {
  return ctx.reply(
    '✅ Tempot is connected!\n\n' +
      'Bot is running in minimal mode.\n' +
      'No database or Redis required at this stage.',
  );
});

bot.command('ping', (ctx) => {
  return ctx.reply('🏓 Pong!');
});

bot.on('message', (ctx) => {
  return ctx.reply(`Echo: ${ctx.message.text ?? '(non-text message)'}`);
});

bot.catch((err) => {
  console.error('❌ Bot error:', err.message);
});

console.log('🚀 Starting Tempot bot in minimal mode...');

bot.start({
  onStart: (info) => {
    console.log(`✅ Bot connected: @${info.username}`);
    console.log('📡 Listening for messages... (Ctrl+C to stop)');
  },
});
