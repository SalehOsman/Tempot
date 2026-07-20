import type { ModuleNavigationItem } from '@tempot/module-registry';
import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import {
  runWithProfileLanguage,
  syncProfileSession,
} from '../services/session-language-sync.service.js';
import { abilityTokensFromContext } from '../services/ability-token.service.js';
import type { UserProfile } from '../types/index.js';

const BOT_ACCESS_MODE_KEY = 'bot_access_mode';

type BotAccessMode = 'private' | 'public';

interface SessionUserSnapshot {
  readonly status?: string;
}

interface KnownUserReplyInput {
  readonly ctx: Context;
  readonly user: UserProfile;
  readonly fallbackName: string;
  readonly telegramId: string;
}

export async function startCommand(ctx: Context): Promise<void> {
  const log = getLogger().child({ command: 'start' });
  const i18n = getI18n();

  const telegramUser = ctx.from;
  if (!telegramUser) {
    log.warn({ msg: 'start_command_no_user' });
    await ctx.reply(i18n.t('user-management.errors.no_user'));
    return;
  }

  const telegramId = telegramUser.id.toString();
  log.info({ msg: 'start_command', telegramId });

  const userResult = await getUserService().getByTelegramId(telegramId);

  if (userResult.isErr()) {
    log.warn({ msg: 'start_user_not_found', telegramId, errorCode: userResult.error.code });
    await replyToUnknownVisitor(ctx);
    return;
  }

  await replyToKnownUser({
    ctx,
    user: userResult.value,
    fallbackName: telegramUser.first_name,
    telegramId,
  });
}

async function replyToUnknownVisitor(ctx: Context): Promise<void> {
  const i18n = getI18n();

  if (sessionUserFromContext(ctx)?.status === 'PENDING') {
    await ctx.reply(i18n.t('user-management.membership.pending_status'), {
      parse_mode: 'HTML',
      reply_markup: createMembershipRequestKeyboard(i18n),
    });
    return;
  }

  const accessMode = readAccessMode(await getDeps().settings.get(BOT_ACCESS_MODE_KEY));
  if (accessMode === 'public') {
    await ctx.reply(i18n.t('user-management.membership.public_prompt'), {
      parse_mode: 'HTML',
      reply_markup: createUnknownVisitorKeyboard(i18n, publicNavigationEntries()),
    });
    return;
  }

  await ctx.reply(i18n.t('user-management.membership.request_prompt'), {
    parse_mode: 'HTML',
    reply_markup: createMembershipRequestKeyboard(i18n),
  });
}

async function replyToKnownUser(input: KnownUserReplyInput): Promise<void> {
  const { ctx, user, fallbackName, telegramId } = input;
  await syncProfileSession(ctx, user);
  await runWithProfileLanguage(user.language, async () => {
    await renderKnownUserReply({ ctx, user, fallbackName, telegramId });
  });
}

async function renderKnownUserReply(input: KnownUserReplyInput): Promise<void> {
  const { ctx, user, fallbackName, telegramId } = input;
  const i18n = getI18n();
  const menuEntries = mainMenuEntriesForUser(ctx, user);
  const keyboard = MainMenuFactory.create(user, i18n, menuEntries);

  const displayName = user.username ?? fallbackName;

  await ctx.reply(
    i18n.t('user-management.menu.welcome', {
      name: displayName,
      role: i18n.t(`user-management.role.${user.role}`),
      language: i18n.t(languageLabelKey(user.language)),
    }),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );

  getLogger().child({ command: 'start' }).info({ msg: 'start_command_ok', userId: user.id });

  // نشر event للـ session warming
  await getDeps().eventBus.publish('user-management.user.started', {
    userId: user.id,
    telegramId,
    role: user.role,
  });
}

function publicNavigationEntries(): readonly ModuleNavigationItem[] {
  return (
    getDeps()
      .navigation?.getVisibleMainMenuItems?.({ role: 'GUEST', abilities: [] })
      .filter((entry) => entry.accessClassification === 'public') ?? []
  );
}

function mainMenuEntriesForUser(ctx: Context, user: UserProfile): readonly ModuleNavigationItem[] {
  const navigation = getDeps().navigation;
  if (navigation === undefined) return [];

  const abilities = abilityTokensFromContext(ctx);
  if (abilities.length > 0 && navigation.getVisibleMainMenuItems !== undefined) {
    return navigation.getVisibleMainMenuItems({ role: user.role, abilities });
  }

  return navigation.getMainMenuItems(user.role);
}

function createMembershipRequestKeyboard(i18n: { t: (key: string) => string }): InlineKeyboard {
  return new InlineKeyboard().text(
    i18n.t('user-management.membership.request_button'),
    'membership:request',
  );
}

function createUnknownVisitorKeyboard(
  i18n: { t: (key: string) => string },
  entries: readonly ModuleNavigationItem[],
): InlineKeyboard {
  const keyboard = createMembershipRequestKeyboard(i18n);

  const sortedEntries = [...entries].sort((left, right) => {
    if (left.row !== right.row) return left.row - right.row;
    return left.order - right.order;
  });

  for (const entry of sortedEntries) {
    keyboard.row().text(i18n.t(entry.labelKey), entry.callbackData);
  }

  return keyboard;
}

function readAccessMode(value: unknown): BotAccessMode {
  return value === 'public' ? 'public' : 'private';
}

function languageLabelKey(language: string): string {
  const [baseLanguage] = language.split('-');
  return `user-management.language.${baseLanguage ?? language}`;
}

function sessionUserFromContext(ctx: Context): SessionUserSnapshot | undefined {
  return (ctx as unknown as { sessionUser?: SessionUserSnapshot }).sessionUser;
}
