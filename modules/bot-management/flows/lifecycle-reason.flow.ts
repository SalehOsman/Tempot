import type { Context } from 'grammy';
import type { Conversation } from '@grammyjs/conversations';
import { ok } from 'neverthrow';
import { z } from 'zod';
import {
  buildActionButtons,
  FieldHandlerRegistry,
  ShortTextFieldHandler,
  runForm,
  type FieldMetadata,
  type FormRunnerDeps,
} from '@tempot/input-engine';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import { getLifecycleService } from '../services/lifecycle-service.context.js';
import { createBotDetailMenu } from '../menus/bot-menu.factory.js';
import { formatBotDetailMessage } from '../menus/bot-detail.factory.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';

export const BOT_LIFECYCLE_REASON_FLOW_ID = 'bot-management-lifecycle-reason';

export interface LifecycleReasonIntent {
  botId: string;
  toStatus: BotLifecycleStatus;
}

interface LifecycleReasonFormData {
  reason: string;
}

type LifecycleReasonConversation = Conversation<Context, Context>;

export async function runLifecycleReasonConversation(
  conversation: LifecycleReasonConversation,
  ctx: Context,
  intent: LifecycleReasonIntent,
): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  const chatId = ctx.chat?.id;
  const i18n = getI18n();
  if (!telegramId || chatId === undefined) {
    await ctx.reply(i18n.t('bot-management.error.no_user'));
    return;
  }

  const formResult = await runLifecycleReasonForm({
    conversation,
    ctx,
    telegramId,
    chatId,
  });
  if (formResult.isErr()) {
    await ctx.reply(i18n.t('bot-management.lifecycle.reason_cancelled'));
    return;
  }

  const transitionResult = await getLifecycleService().transition({
    botId: intent.botId,
    toStatus: intent.toStatus,
    actorId: telegramId,
    reason: formResult.value.reason.trim(),
  });
  if (transitionResult.isErr()) {
    await ctx.reply(
      i18n.t(`bot-management.error.${transitionResult.error.code.split('.').at(-1)}`),
    );
    return;
  }

  await ctx.reply(formatBotDetailMessage(i18n.t, transitionResult.value), {
    reply_markup: createBotDetailMenu(i18n.t, transitionResult.value),
  });
}

interface RunLifecycleReasonFormInput {
  conversation: LifecycleReasonConversation;
  ctx: Context;
  telegramId: string;
  chatId: number;
}

async function runLifecycleReasonForm(input: RunLifecycleReasonFormInput) {
  let activeConversation: string | undefined;
  return runForm<LifecycleReasonFormData>(
    {
      conversation: input.conversation,
      ctx: input.ctx,
      schema: createLifecycleReasonSchema(),
      options: {
        formId: BOT_LIFECYCLE_REASON_FLOW_ID,
        showConfirmation: false,
      },
    },
    createFormRunnerDeps({
      conversation: input.conversation,
      ctx: input.ctx,
      telegramId: input.telegramId,
      chatId: input.chatId,
      getActiveConversation: () => activeConversation,
      setActiveConversation: (formId) => {
        activeConversation = formId;
      },
    }),
  );
}

interface FormDepsInput {
  conversation: LifecycleReasonConversation;
  ctx: Context;
  telegramId: string;
  chatId: number;
  getActiveConversation: () => string | undefined;
  setActiveConversation: (formId: string | undefined) => void;
}

function createFormRunnerDeps(input: FormDepsInput): FormRunnerDeps {
  const i18n = getI18n();
  const deps = getDeps();
  const registry = new FieldHandlerRegistry();
  registry.register(new ShortTextFieldHandler());

  return {
    registry,
    logger: getLogger(),
    eventBus: {
      publish: async (eventName, payload) => {
        const recordPayload =
          payload !== null && typeof payload === 'object'
            ? (payload as Record<string, unknown>)
            : { payload };
        await deps.eventBus.publish(eventName, recordPayload);
        return ok(undefined);
      },
    },
    isEnabled: () => deps.config.features.hasInputEngine === true,
    getActiveConversation: input.getActiveConversation,
    setActiveConversation: input.setActiveConversation,
    userId: input.telegramId,
    chatId: input.chatId,
    t: i18n.t,
    renderPrompt: async (renderCtx, metadata) => {
      await input.ctx.reply(i18n.t(metadata.i18nKey), {
        reply_markup: createPromptKeyboard(renderCtx, metadata, i18n.t),
      });
      return ok(await input.conversation.waitFor(['message:text', 'callback_query:data']));
    },
  };
}

function createPromptKeyboard(
  renderCtx: { formId: string; fieldIndex: number; previousValue?: unknown },
  metadata: FieldMetadata,
  t: (key: string, options?: Record<string, unknown>) => string,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const rows = buildActionButtons(
    {
      formId: renderCtx.formId,
      fieldIndex: renderCtx.fieldIndex,
      isOptional: metadata.optional === true,
      isFirstField: renderCtx.fieldIndex === 0,
      allowCancel: true,
      hasPreviousValue: renderCtx.previousValue !== undefined,
    },
    t,
  );

  return {
    inline_keyboard: rows.map((row) =>
      row.buttons.map((button) => ({
        text: button.text,
        callback_data: button.callbackData,
      })),
    ),
  };
}

function createLifecycleReasonSchema(): z.ZodObject<z.ZodRawShape> {
  return z.object({
    reason: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.lifecycle.reason_prompt',
      minLength: 1,
      maxLength: 300,
    }),
  });
}

function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}
