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
import { BotRuntimeMode } from '../types/bot.types.js';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import { getBotService } from '../services/bot-service.context.js';
import { createBotDetailMenu } from '../menus/bot-menu.factory.js';
import { formatBotDetailMessage } from '../menus/bot-detail.factory.js';
import { BOT_REGISTRATION_FLOW_ID } from '../commands/new-bot.command.js';

interface BotRegistrationFormData {
  displayName: string;
  telegramUsername: string;
  token: string;
}

type BotRegistrationConversation = Conversation<Context, Context>;

export async function runBotRegistrationConversation(
  conversation: BotRegistrationConversation,
  ctx: Context,
): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  const chatId = ctx.chat?.id;
  const i18n = getI18n();
  if (!telegramId || chatId === undefined) {
    await ctx.reply(i18n.t('bot-management.error.no_user'));
    return;
  }

  const formResult = await runRegistrationForm({ conversation, ctx, telegramId, chatId });
  if (formResult.isErr()) {
    await ctx.reply(i18n.t('bot-management.error.create_failed'));
    return;
  }

  await persistRegistration({ ctx, telegramId, data: formResult.value });
}

interface RunRegistrationFormInput {
  conversation: BotRegistrationConversation;
  ctx: Context;
  telegramId: string;
  chatId: number;
}

async function runRegistrationForm(input: RunRegistrationFormInput) {
  let activeConversation: string | undefined;
  return runForm<BotRegistrationFormData>(
    {
      conversation: input.conversation,
      ctx: input.ctx,
      schema: createBotRegistrationSchema(),
      options: {
        formId: BOT_REGISTRATION_FLOW_ID,
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

interface PersistRegistrationInput {
  ctx: Context;
  telegramId: string;
  data: BotRegistrationFormData;
}

async function persistRegistration(input: PersistRegistrationInput): Promise<void> {
  const i18n = getI18n();
  const registerResult = await getBotService().register(
    {
      displayName: input.data.displayName.trim(),
      telegramUsername: input.data.telegramUsername.trim().replace(/^@/, ''),
      token: input.data.token.trim(),
      ownerId: input.telegramId,
      runtimeMode: BotRuntimeMode.POLLING,
      defaultLocale: 'ar-EG',
      defaultCountry: 'EG',
      timezone: 'Africa/Cairo',
    },
    input.telegramId,
  );

  if (registerResult.isErr()) {
    await input.ctx.reply(
      i18n.t(`bot-management.error.${registerResult.error.code.split('.').at(-1)}`),
    );
    return;
  }

  await input.ctx.reply(formatBotDetailMessage(i18n.t, registerResult.value), {
    reply_markup: createBotDetailMenu(i18n.t, registerResult.value),
  });
}

interface FormDepsInput {
  conversation: BotRegistrationConversation;
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

function createBotRegistrationSchema(): z.ZodObject<z.ZodRawShape> {
  return z.object({
    displayName: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.display_name',
      minLength: 1,
      maxLength: 120,
    }),
    telegramUsername: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.telegram_username',
      minLength: 1,
      maxLength: 64,
    }),
    token: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.token',
      minLength: 10,
      maxLength: 256,
    }),
  });
}

function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}
