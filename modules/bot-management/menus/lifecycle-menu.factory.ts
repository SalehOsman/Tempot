import { InlineKeyboard } from 'grammy';
import { createInlineKeyboard, type TempotInlineKeyboard } from '@tempot/ux-helpers';
import {
  VALID_BOT_TRANSITIONS,
  requiresTransitionReason,
} from '../contracts/lifecycle-transitions.js';
import type { ManagedBot } from '../types/bot.types.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function createLifecycleMenu(t: Translate, bot: ManagedBot): InlineKeyboard {
  const keyboard = createInlineKeyboard();
  const transitions = VALID_BOT_TRANSITIONS[bot.status];

  for (const transition of transitions) {
    appendLifecycleAction({
      keyboard,
      t,
      botId: bot.id,
      fromStatus: bot.status,
      toStatus: transition,
    });
  }

  keyboard.row();
  addButton(keyboard, t('bot-management.menu.back'), `botmgmt:view:${bot.id}`);
  return keyboard.toGrammyKeyboard();
}

export function createArchiveConfirmationMenu(t: Translate, botId: string): InlineKeyboard {
  const keyboard = createInlineKeyboard();

  addButton(
    keyboard,
    t('bot-management.actions.confirm_archive'),
    `botmgmt:lifecycle-archive-start:${botId}`,
  );
  keyboard.row();
  addButton(keyboard, t('bot-management.menu.back'), `botmgmt:lifecycle:${botId}`);

  return keyboard.toGrammyKeyboard();
}

interface LifecycleActionInput {
  keyboard: TempotInlineKeyboard;
  t: Translate;
  botId: string;
  fromStatus: BotLifecycleStatus;
  toStatus: BotLifecycleStatus;
}

function appendLifecycleAction(input: LifecycleActionInput): void {
  if (input.toStatus === BotLifecycleStatus.ARCHIVED) {
    input.keyboard.row();
    addButton(
      input.keyboard,
      input.t('bot-management.actions.archive'),
      `botmgmt:lifecycle-archive-confirm:${input.botId}`,
    );
    return;
  }

  const callbackPrefix = requiresTransitionReason(input.fromStatus, input.toStatus)
    ? 'botmgmt:lifecycle-reason'
    : 'botmgmt:lifecycle-transition';

  addButton(
    input.keyboard,
    lifecycleActionLabel(input.t, input.fromStatus, input.toStatus),
    `${callbackPrefix}:${input.botId}:${input.toStatus}`,
  );
}

function lifecycleActionLabel(
  t: Translate,
  fromStatus: BotLifecycleStatus,
  toStatus: BotLifecycleStatus,
): string {
  if (toStatus === BotLifecycleStatus.CONFIGURED) {
    return t('bot-management.actions.configure');
  }
  if (toStatus === BotLifecycleStatus.ACTIVE) {
    return fromStatus === BotLifecycleStatus.CONFIGURED
      ? t('bot-management.actions.activate')
      : t('bot-management.actions.resume');
  }
  if (toStatus === BotLifecycleStatus.PAUSED) {
    return t('bot-management.actions.pause');
  }
  return t('bot-management.actions.maintenance');
}

function addButton(
  keyboard: TempotInlineKeyboard,
  label: string,
  callbackData: string,
): TempotInlineKeyboard {
  const result = keyboard.button({ label, callbackData });
  if (result.isErr()) throw result.error;
  return result.value;
}
