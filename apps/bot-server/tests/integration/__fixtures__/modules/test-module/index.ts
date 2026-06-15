// Self-contained test fixture: shape-compatible with ModuleSetupFn from
// src/bot-server.types.ts without importing it, so the fixture can compile
// in isolation (single-directory rootDir) for CI fixture-build step.
interface FixtureBot {
  command: (name: string, handler: (ctx: { reply: (text: string) => void }) => void) => void;
}
interface FixtureDeps {
  logger: { info: (payload: { msg: string }) => void };
}

const setup = async (bot: FixtureBot, deps: FixtureDeps): Promise<void> => {
  deps.logger.info({ msg: 'Test module loading...' });
  bot.command('ping', (ctx) => ctx.reply('pong'));
};

export default setup;
