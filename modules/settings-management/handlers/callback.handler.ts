import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createSettingsMenu, type SettingsMenuSurface } from '../menus/settings-menu.factory.js';

type BotAccessMode = 'private' | 'public';

const noopNext: NextFunction = () => Promise.resolve();
const BOT_ACCESS_MODE_KEY = 'bot_access_mode';
const BOT_ACCESS_MODES = {
  private: 'private',
  public: 'public',
} as const;
const VIEW_KEYS: Readonly<Record<string, string>> = {
  view: 'settings-management.view.title',
  profile: 'settings-management.view.profile',
  regional: 'settings-management.view.regional',
  'regional:language': 'settings-management.view.regional_language',
  'regional:timezone': 'settings-management.view.regional_timezone',
  'regional:defaults': 'settings-management.view.regional_defaults',
};

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('settings:')) {
    await next();
    return;
  }

  const action = data.slice('settings:'.length) || 'view';
  if (action.startsWith('access-mode')) {
    await handleAccessMode(ctx, action);
    return;
  }

  if (
    !(await getDeps().authorization.enforce(ctx, {
      module: 'settings-management',
      classification: 'protected',
      action: 'read',
      subject: 'settings',
    }))
  ) {
    return;
  }
  await showSettingsPage(ctx, action);
}

async function showSettingsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const key = VIEW_KEYS[action] ?? 'settings-management.view.title';

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key),
    viewKey: key,
    parseMode: 'HTML',
    replyMarkup: createSettingsMenu(i18n.t, resolveMenuSurface(action)),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function handleAccessMode(ctx: Context, action: string): Promise<void> {
  if (!(await canManageAccessMode(ctx))) return;

  const [, setAction, requestedMode] = action.split(':');
  if (setAction === 'set') {
    await updateAccessMode(ctx, parseBotAccessMode(requestedMode));
    return;
  }

  await showAccessModePage(ctx, 'settings-management.view.access_mode');
}

async function canManageAccessMode(ctx: Context): Promise<boolean> {
  return getDeps().authorization.enforce(ctx, {
    module: 'settings-management',
    classification: 'protected',
    action: 'manage',
    subject: 'bot-access-mode',
  });
}

async function updateAccessMode(ctx: Context, nextMode: BotAccessMode | null): Promise<void> {
  const { i18n, settings } = getDeps();
  if (nextMode === null) {
    await ctx.reply(i18n.t('settings-management.view.access_mode_update_failed'));
    return;
  }

  const previousMode = await getCurrentAccessMode();
  const actor = actorFromContext(ctx);
  const result = await settings.set(BOT_ACCESS_MODE_KEY, nextMode, actor.id);
  if (result === null) {
    await ctx.reply(i18n.t('settings-management.view.access_mode_update_failed'));
    return;
  }

  auditAccessModeChange({
    actor,
    previousMode,
    nextMode,
  });
  await showAccessModePage(ctx, 'settings-management.view.access_mode_updated');
}

async function showAccessModePage(ctx: Context, key: string): Promise<void> {
  const { i18n } = getDeps();
  const mode = await getCurrentAccessMode();
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: i18n.t(key, { mode }),
    viewKey: key,
    parseMode: 'HTML',
    replyMarkup: createSettingsMenu(i18n.t, 'access-mode'),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function getCurrentAccessMode(): Promise<BotAccessMode> {
  const raw = await getDeps().settings.get(BOT_ACCESS_MODE_KEY);
  return parseBotAccessMode(raw) ?? BOT_ACCESS_MODES.private;
}

function parseBotAccessMode(value: unknown): BotAccessMode | null {
  if (value === BOT_ACCESS_MODES.private || value === BOT_ACCESS_MODES.public) return value;
  return null;
}

interface SettingsContextState {
  sessionUser?: { id: string | number; role?: string };
}

function actorFromContext(ctx: Context): { id: string | null; role: string | null } {
  const sessionUser = (ctx as Context & SettingsContextState).sessionUser;
  return {
    id: sessionUser?.id === undefined ? null : String(sessionUser.id),
    role: sessionUser?.role ?? null,
  };
}

function auditAccessModeChange(input: {
  actor: { id: string | null; role: string | null };
  previousMode: BotAccessMode;
  nextMode: BotAccessMode;
}): void {
  getDeps().logger.info({
    msg: 'settings-management.audit',
    action: 'settings-management.botAccessMode.update',
    module: 'settings-management',
    userId: input.actor.id,
    userRole: input.actor.role,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    before: { accessMode: input.previousMode },
    after: { accessMode: input.nextMode },
  });
}

function resolveMenuSurface(action: string): SettingsMenuSurface {
  const [section] = action.split(':');
  if (section === 'regional' && action !== 'regional') return 'regional-leaf';
  if (section === 'access-mode') return 'access-mode';
  if (section === 'profile' || section === 'regional') {
    return section;
  }
  return 'main';
}
