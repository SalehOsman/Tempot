import { InlineKeyboard } from 'grammy';
import {
  VALID_BOT_TRANSITIONS,
  requiresTransitionReason,
} from '../contracts/lifecycle-transitions.js';
import type { ManagedBot } from '../types/bot.types.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function createLifecycleMenu(t: Translate, bot: ManagedBot): InlineKeyboard {
  const keyboard = new InlineKeyboard();
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

  return keyboard.text(t('bot-management.menu.back'), `botmgmt:view:${bot.id}`);
}

export function createArchiveConfirmationMenu(t: Translate, botId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('bot-management.actions.confirm_archive'), `botmgmt:lifecycle-archive-start:${botId}`)
    .text(t('bot-management.menu.back'), `botmgmt:lifecycle:${botId}`);
}

interface LifecycleActionInput {
  keyboard: InlineKeyboard;
  t: Translate;
  botId: string;
  fromStatus: BotLifecycleStatus;
  toStatus: BotLifecycleStatus;
}

function appendLifecycleAction(input: LifecycleActionInput): void {
  if (input.toStatus === BotLifecycleStatus.ARCHIVED) {
    input.keyboard.text(
      input.t('bot-management.actions.archive'),
      `botmgmt:lifecycle-archive-confirm:${input.botId}`,
    );
    return;
  }

  const callbackPrefix = requiresTransitionReason(input.fromStatus, input.toStatus)
    ? 'botmgmt:lifecycle-reason'
    : 'botmgmt:lifecycle-transition';

  input.keyboard.text(
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
