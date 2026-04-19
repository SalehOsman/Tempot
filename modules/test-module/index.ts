/**
 * Test Module — index.ts
 *
 * Default export: ModuleSetupFn compatible signature.
 * Registers all command handlers on the grammY bot instance.
 *
 * No business logic — purely diagnostic. Remove when first real module is ready.
 *
 * i18n: all user-facing text is served via deps.i18n.t() (Rule #2).
 * Types: no `any`, structural typing for deps (Rule #10).
 */
import type { Bot, Context } from 'grammy';
import type { ModuleConfig, ModuleCommand } from '@tempot/module-registry';

// ---------------------------------------------------------------------------
// Local structural types — mirror ModuleDependencyContainer from bot-server
// without creating a cross-app dependency. TypeScript structural typing
// guarantees compatibility at the call site (module-loader.ts).
// ---------------------------------------------------------------------------

export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
}

export interface ModuleSessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

export interface ModuleI18n {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface ModuleSettings {
  get: (key: string) => Promise<unknown>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: ModuleSessionProvider;
  i18n: ModuleI18n;
  settings: ModuleSettings;
  config: ModuleConfig;
}

// ---------------------------------------------------------------------------
// Command handlers — each in its own named function (max-lines-per-function)
// ---------------------------------------------------------------------------

async function handleStart(ctx: Context, deps: ModuleDeps): Promise<void> {
  const userId = ctx.from?.id ?? 0;
  deps.logger.info({ msg: 'command_received', command: 'start', userId });

  const commandList = deps.config.commands
    .map((c: ModuleCommand) => `/${c.command} — ${deps.i18n.t(c.description)}`)
    .join('\n');

  await ctx.reply(
    [
      deps.i18n.t('test-module.start.header'),
      '',
      deps.i18n.t('test-module.start.user_id', { userId }),
      deps.i18n.t('test-module.start.version', { version: deps.config.version }),
      '',
      deps.i18n.t('test-module.start.commands_header'),
      commandList,
    ].join('\n'),
    { parse_mode: 'Markdown' },
  );
}

async function handlePing(ctx: Context, deps: ModuleDeps): Promise<void> {
  const start = Date.now();
  deps.logger.info({ msg: 'command_received', command: 'ping', userId: ctx.from?.id });

  const sent = await ctx.reply(deps.i18n.t('test-module.ping.measuring'));
  const latency = Date.now() - start;

  const chatId = ctx.chatId ?? ctx.from?.id;
  if (chatId !== undefined) {
    await ctx.api.editMessageText(
      chatId,
      sent.message_id,
      deps.i18n.t('test-module.ping.result', { latency }),
      { parse_mode: 'Markdown' },
    );
  }
}

async function handleWhoami(ctx: Context, deps: ModuleDeps): Promise<void> {
  const userId = String(ctx.from?.id ?? '');
  const chatId = String(ctx.chat?.id ?? '');
  deps.logger.info({ msg: 'command_received', command: 'whoami', userId });

  const session = (await deps.sessionProvider.getSession(userId, chatId)) as Record<
    string,
    unknown
  > | null;

  if (!session) {
    await ctx.reply(deps.i18n.t('test-module.whoami.no_session'));
    return;
  }

  await ctx.reply(
    [
      deps.i18n.t('test-module.whoami.header'),
      '',
      deps.i18n.t('test-module.whoami.user_id', { userId }),
      deps.i18n.t('test-module.whoami.chat_id', { chatId }),
      deps.i18n.t('test-module.whoami.role', { role: String(session['role'] ?? 'GUEST') }),
      deps.i18n.t('test-module.whoami.language', {
        language: String(session['language'] ?? 'ar-EG'),
      }),
      deps.i18n.t('test-module.whoami.status', { status: String(session['status'] ?? 'ACTIVE') }),
    ].join('\n'),
    { parse_mode: 'Markdown' },
  );
}

async function handleDbtest(ctx: Context, deps: ModuleDeps): Promise<void> {
  deps.logger.info({ msg: 'command_received', command: 'dbtest', userId: ctx.from?.id });

  const maintenanceMode = await deps.settings.get('maintenance_mode');

  await ctx.reply(
    [
      deps.i18n.t('test-module.dbtest.header'),
      '',
      deps.i18n.t('test-module.dbtest.connected'),
      deps.i18n.t('test-module.dbtest.maintenance', { value: String(maintenanceMode ?? 'false') }),
    ].join('\n'),
    { parse_mode: 'Markdown' },
  );
}

async function handleStatus(ctx: Context, deps: ModuleDeps): Promise<void> {
  deps.logger.info({ msg: 'command_received', command: 'status', userId: ctx.from?.id });

  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const memMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  await ctx.reply(
    [
      deps.i18n.t('test-module.status.header'),
      '',
      deps.i18n.t('test-module.status.uptime', { h, m, s }),
      deps.i18n.t('test-module.status.memory', { memMb }),
      deps.i18n.t('test-module.status.module', {
        name: deps.config.name,
        version: deps.config.version,
      }),
      deps.i18n.t('test-module.status.running'),
    ].join('\n'),
    { parse_mode: 'Markdown' },
  );

  await deps.eventBus.publish('test-module.status.requested', {
    userId: String(ctx.from?.id ?? ''),
    uptimeSeconds: uptime,
  });
}

// ---------------------------------------------------------------------------
// Setup — registers handlers, injected by module-loader at startup
// ---------------------------------------------------------------------------

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  bot.command('start', (ctx) => handleStart(ctx, deps));
  bot.command('ping', (ctx) => handlePing(ctx, deps));
  bot.command('whoami', (ctx) => handleWhoami(ctx, deps));
  bot.command('dbtest', (ctx) => handleDbtest(ctx, deps));
  bot.command('status', (ctx) => handleStatus(ctx, deps));

  deps.logger.info({
    msg: 'test-module handlers registered',
    commandCount: deps.config.commands.length,
  });
};

export default setup;
