import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import type { UserRole } from '@tempot/module-registry';
import { getDeps } from '../deps.context.js';
import { createHelpMenu } from '../menus/help-menu.factory.js';
import { HelpContentService } from '../services/help-content.service.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('help:')) {
    await next();
    return;
  }

  const action = data.split(':')[1] ?? 'view';
  await showHelpPage(ctx, action);
}

async function showHelpPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: await resolveHelpText(ctx, action),
    parseMode: 'HTML',
    replyMarkup: createHelpMenu(i18n.t, action === 'view' ? 'main' : 'leaf'),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function resolveHelpText(ctx: Context, action: string): Promise<string> {
  const deps = getDeps();
  const service = new HelpContentService(
    deps.config,
    deps.navigation ? (role) => deps.navigation?.getMainMenuItems(role) ?? [] : undefined,
  );
  if (action === 'commands') return service.renderCommands(deps.i18n.t, await resolveRole(ctx));
  if (action === 'support') {
    return service.renderSupport(deps.i18n.t, ctx.from?.id, ctx.chat?.id);
  }
  return deps.i18n.t('help-center.view.title');
}

async function resolveRole(ctx: Context): Promise<UserRole> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (userId === undefined || chatId === undefined) return 'USER';
  const session = await getDeps().sessionProvider.getSession(String(userId), String(chatId));
  return readRole(session) ?? 'USER';
}

function readRole(value: unknown): UserRole | undefined {
  const session = readResultValue(value) ?? value;
  if (!isRecord(session)) return undefined;
  const role = session['role'];
  return isUserRole(role) ? role : undefined;
}

function readResultValue(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  const isOk = value['isOk'];
  if (typeof isOk !== 'function' || isOk.call(value) !== true) return undefined;
  return value['value'];
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'GUEST' || value === 'USER' || value === 'ADMIN' || value === 'SUPER_ADMIN';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
