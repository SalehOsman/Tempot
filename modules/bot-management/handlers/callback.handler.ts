import type { Context, NextFunction } from 'grammy';
import type { InlineKeyboard } from 'grammy';
import { answerCallback, editOrSend } from '@tempot/ux-helpers';
import { getAuthorization, getI18n } from '../deps.context.js';
import { getBotService } from '../services/bot-service.context.js';
import { getLifecycleService } from '../services/lifecycle-service.context.js';
import { createBotDetailMenu, createBotListMenu } from '../menus/bot-menu.factory.js';
import {
  createArchiveConfirmationMenu,
  createLifecycleMenu,
} from '../menus/lifecycle-menu.factory.js';
import { formatBotDetailMessage, formatBotListMessage } from '../menus/bot-detail.factory.js';
import { newBotCommand } from '../commands/new-bot.command.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';
import {
  BOT_LIFECYCLE_REASON_FLOW_ID,
  type LifecycleReasonIntent,
} from '../flows/lifecycle-reason.flow.js';
import { resolveCallbackAuthorizationPolicy } from './callback-authorization.policy.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('botmgmt:')) {
    await next();
    return;
  }

  const [, action, value, trailingValue] = data.split(':');
  const policy = resolveCallbackAuthorizationPolicy(action);
  if (!(await getAuthorization().enforce(ctx, policy))) return;

  if (action === 'create') {
    await acknowledgeCallback(ctx);
    await newBotCommand(ctx);
    return;
  }
  if (action === 'view' && value) {
    await showBotDetail(ctx, value);
    return;
  }
  if (action === 'list') {
    await showBotList(ctx, Number(value ?? 0));
    return;
  }
  if (action === 'lifecycle' && value) {
    await showLifecycleMenu(ctx, value);
    return;
  }
  if ((action === 'settings' || action === 'modules') && value) {
    await replyWithCallback(ctx, getI18n().t('bot-management.error.section_unavailable'));
    return;
  }
  if (action === 'lifecycle-transition' && value && trailingValue) {
    await applyDirectLifecycleTransition(ctx, value, trailingValue);
    return;
  }
  if (action === 'lifecycle-reason' && value && trailingValue) {
    await startLifecycleReasonFlow(ctx, value, trailingValue);
    return;
  }
  if ((action === 'lifecycle-archive-confirm' || action === 'archive') && value) {
    await showArchiveConfirmation(ctx, value);
    return;
  }
  if (action === 'lifecycle-archive-start' && value) {
    await startLifecycleReasonFlow(ctx, value, BotLifecycleStatus.ARCHIVED);
  }
}

async function showBotList(ctx: Context, page: number): Promise<void> {
  const i18n = getI18n();
  const result = await getBotService().list(page);
  if (result.isErr()) {
    await replyWithCallback(ctx, i18n.t('bot-management.error.list_failed'));
    return;
  }

  const totalPages = Math.max(1, Math.ceil(result.value.totalCount / result.value.pageSize));
  await editCallbackMessage(
    ctx,
    formatBotListMessage(i18n.t, result.value),
    createBotListMenu({ t: i18n.t, bots: result.value.bots, page, totalPages }),
  );
}

async function showBotDetail(ctx: Context, botId: string): Promise<void> {
  const i18n = getI18n();
  const result = await getBotService().getDetail(botId);
  if (result.isErr()) {
    await replyWithCallback(ctx, i18n.t('bot-management.error.not_found'));
    return;
  }

  await editCallbackMessage(
    ctx,
    formatBotDetailMessage(i18n.t, result.value),
    createBotDetailMenu(i18n.t, result.value),
  );
}

async function showLifecycleMenu(ctx: Context, botId: string): Promise<void> {
  const i18n = getI18n();
  const result = await getBotService().getDetail(botId);
  if (result.isErr()) {
    await replyWithCallback(ctx, i18n.t('bot-management.error.not_found'));
    return;
  }

  await editCallbackMessage(
    ctx,
    formatBotDetailMessage(i18n.t, result.value),
    createLifecycleMenu(i18n.t, result.value),
  );
}

async function applyDirectLifecycleTransition(
  ctx: Context,
  botId: string,
  rawStatus: string,
): Promise<void> {
  const i18n = getI18n();
  const toStatus = parseLifecycleStatus(rawStatus);
  const actorId = ctx.from?.id.toString();
  if (!toStatus || !actorId) {
    await replyWithCallback(ctx, i18n.t('bot-management.error.invalid_transition'));
    return;
  }

  const result = await getLifecycleService().transition({ botId, toStatus, actorId });
  if (result.isErr()) {
    await replyWithCallback(
      ctx,
      i18n.t(`bot-management.error.${result.error.code.split('.').at(-1)}`),
    );
    return;
  }

  await editCallbackMessage(
    ctx,
    formatBotDetailMessage(i18n.t, result.value),
    createBotDetailMenu(i18n.t, result.value),
  );
}

function parseLifecycleStatus(value: string): BotLifecycleStatus | null {
  return Object.values(BotLifecycleStatus).find((status) => status === value) ?? null;
}

interface ConversationStarterContext extends Context {
  conversation?: {
    enter: (flowId: string, intent: LifecycleReasonIntent) => Promise<void>;
  };
}

async function startLifecycleReasonFlow(
  ctx: Context,
  botId: string,
  rawStatus: string,
): Promise<void> {
  const i18n = getI18n();
  const toStatus = parseLifecycleStatus(rawStatus);
  const starter = ctx as ConversationStarterContext;
  if (!toStatus || !starter.conversation) {
    await replyWithCallback(ctx, i18n.t('bot-management.error.invalid_transition'));
    return;
  }

  await acknowledgeCallback(ctx);
  await starter.conversation.enter(BOT_LIFECYCLE_REASON_FLOW_ID, { botId, toStatus });
}

async function showArchiveConfirmation(ctx: Context, botId: string): Promise<void> {
  const i18n = getI18n();
  await editCallbackMessage(
    ctx,
    i18n.t('bot-management.lifecycle.archive_confirmation'),
    createArchiveConfirmationMenu(i18n.t, botId),
  );
}

async function editCallbackMessage(
  ctx: Context,
  text: string,
  keyboard: InlineKeyboard,
): Promise<void> {
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text,
    replyMarkup: keyboard,
    unchangedCallbackText: getI18n().t('bot-server.callback_unchanged'),
  });

  if (result.isErr()) throw result.error;
}

async function acknowledgeCallback(ctx: Context): Promise<void> {
  const result = await answerCallback(ctx as unknown as Parameters<typeof answerCallback>[0]);
  if (result.isErr()) throw result.error;
}

async function replyWithCallback(ctx: Context, text: string): Promise<void> {
  await acknowledgeCallback(ctx);
  await ctx.reply(text);
}
