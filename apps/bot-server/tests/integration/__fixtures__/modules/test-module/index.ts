import type { ModuleSetupFn } from '../../../../../../src/bot-server.types.js';

const setup: ModuleSetupFn = async (bot, deps) => {
  deps.logger.info({ msg: 'Test module loading...' });
  bot.command('ping', (ctx) => ctx.reply('pong'));
};

export default setup;
