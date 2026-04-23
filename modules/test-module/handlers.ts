/**
 * Test Module — handlers.ts
 *
 * Extended diagnostic handlers: settings, event, session.
 * Separated from index.ts to keep each file under 200 lines (ESLint rule).
 *
 * i18n: all user-facing text is served via deps.i18n.t() (Rule #2).
 * Types: no `any`, structural typing for deps (Rule #10).
 */
import type { Context } from 'grammy';
import type { ModuleDeps } from './index.js';

export async function handleSettings(ctx: Context, deps: ModuleDeps): Promise<void> {
  const args = ctx.message?.text?.split(' ').slice(1) ?? [];
  const key = args[0]?.trim();

  if (!key) {
    await ctx.reply(deps.i18n.t('test-module.settings.usage'), { parse_mode: 'Markdown' });
    return;
  }

  deps.logger.info({ msg: 'command_received', command: 'settings', userId: ctx.from?.id, key });

  const value = await deps.settings.get(key);

  if (value === null || value === undefined) {
    await ctx.reply(deps.i18n.t('test-module.settings.not_found', { key }), {
      parse_mode: 'Markdown',
    });
    return;
  }

  await ctx.reply(
    [
      deps.i18n.t('test-module.settings.header', { key }),
      deps.i18n.t('test-module.settings.value', { value: String(value) }),
    ].join('\n'),
    { parse_mode: 'Markdown' },
  );
}

export async function handleEvent(ctx: Context, deps: ModuleDeps): Promise<void> {
  const args = ctx.message?.text?.split(' ').slice(1) ?? [];
  const name = args[0]?.trim();

  if (!name) {
    await ctx.reply(deps.i18n.t('test-module.event.usage'), { parse_mode: 'Markdown' });
    return;
  }

  deps.logger.info({ msg: 'command_received', command: 'event', userId: ctx.from?.id, name });

  const result = await deps.eventBus.publish(name, {
    triggeredBy: String(ctx.from?.id ?? 'unknown'),
    source: 'test-module',
  });

  if (result.isOk()) {
    await ctx.reply(deps.i18n.t('test-module.event.published', { name }), {
      parse_mode: 'Markdown',
    });
  } else {
    await ctx.reply(deps.i18n.t('test-module.event.failed', { name }), { parse_mode: 'Markdown' });
  }
}

export async function handleSession(ctx: Context, deps: ModuleDeps): Promise<void> {
  const userId = String(ctx.from?.id ?? '');
  const chatId = String(ctx.chat?.id ?? '');
  deps.logger.info({ msg: 'command_received', command: 'session', userId });

  const session = (await deps.sessionProvider.getSession(userId, chatId)) as Record<
    string,
    unknown
  > | null;

  if (!session) {
    await ctx.reply(deps.i18n.t('test-module.session.no_session'), { parse_mode: 'Markdown' });
    return;
  }

  const fields = Object.entries(session)
    .map(([key, value]) =>
      deps.i18n.t('test-module.session.field', { key, value: String(value ?? '—') }),
    )
    .join('\n');

  await ctx.reply([deps.i18n.t('test-module.session.header'), '', fields].join('\n'), {
    parse_mode: 'Markdown',
  });
}
