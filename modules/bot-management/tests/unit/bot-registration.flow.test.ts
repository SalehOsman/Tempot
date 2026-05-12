import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BotRuntimeMode, BotHealthStatus } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

const { runFormMock, registerMock } = vi.hoisted(() => ({
  runFormMock: vi.fn(),
  registerMock: vi.fn(),
}));

vi.mock('@tempot/input-engine', () => ({
  buildActionButtons: () => [
    {
      buttons: [
        {
          text: 'input-engine.actions.cancel',
          callbackData: 'ie:bot-management-registration:1:__cancel__',
        },
      ],
    },
  ],
  FieldHandlerRegistry: class {
    register(): void {}
  },
  ShortTextFieldHandler: class {},
  runForm: runFormMock,
}));

vi.mock('../../deps.context.js', () => ({
  getDeps: () => ({
    eventBus: { publish: vi.fn() },
    config: { features: { hasInputEngine: true } },
  }),
  getI18n: () => ({
    t: (key: string) => key,
  }),
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../services/bot-service.context.js', () => ({
  getBotService: () => ({
    register: registerMock,
  }),
}));

vi.mock('../../menus/bot-detail.factory.js', () => ({
  formatBotDetailMessage: () => 'bot detail',
}));

vi.mock('../../menus/bot-menu.factory.js', () => ({
  createBotDetailMenu: () => ({ inline_keyboard: [] }),
}));

import { runBotRegistrationConversation } from '../../flows/bot-registration.flow.js';

const managedBot = {
  id: 'bot-1',
  displayName: 'Support Bot',
  telegramUsername: 'support_bot',
  tokenFingerprint: 'fingerprint',
  tokenRedacted: '1234567...abcd',
  ownerId: '123',
  runtimeMode: BotRuntimeMode.POLLING,
  status: BotLifecycleStatus.DRAFT,
  defaultLocale: 'ar-EG',
  defaultCountry: 'EG',
  timezone: 'Africa/Cairo',
  healthStatus: BotHealthStatus.UNKNOWN,
  createdAt: new Date('2026-05-12T00:00:00.000Z'),
  updatedAt: new Date('2026-05-12T00:00:00.000Z'),
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
};

describe('runBotRegistrationConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the shared form engine and persists the completed registration result', async () => {
    runFormMock.mockResolvedValue(
      ok({
        displayName: 'Support Bot',
        telegramUsername: '@support_bot',
        token: '1234567890abcdef',
      }),
    );
    registerMock.mockResolvedValue(ok(managedBot));

    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runBotRegistrationConversation({}, ctx as never);

    expect(runFormMock).toHaveBeenCalledTimes(1);
    expect(registerMock).toHaveBeenCalledWith(
      {
        displayName: 'Support Bot',
        telegramUsername: 'support_bot',
        token: '1234567890abcdef',
        ownerId: '123',
        runtimeMode: BotRuntimeMode.POLLING,
        defaultLocale: 'ar-EG',
        defaultCountry: 'EG',
        timezone: 'Africa/Cairo',
      },
      '123',
    );
    expect(ctx.reply).toHaveBeenCalledWith('bot detail', {
      reply_markup: { inline_keyboard: [] },
    });
  });

  it('returns the service error feedback when registration is rejected', async () => {
    runFormMock.mockResolvedValue(
      ok({
        displayName: 'Support Bot',
        telegramUsername: 'support_bot',
        token: '1234567890abcdef',
      }),
    );
    registerMock.mockResolvedValue(err(new AppError('bot-management.duplicate_username')));

    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runBotRegistrationConversation({}, ctx as never);

    expect(ctx.reply).toHaveBeenCalledWith('bot-management.error.duplicate_username');
  });

  it('does not persist a bot when the shared form reports cancellation', async () => {
    runFormMock.mockResolvedValue(err(new AppError('input-engine.form.cancelled')));

    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runBotRegistrationConversation({}, ctx as never);

    expect(registerMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('bot-management.error.create_failed');
  });

  it('renders reusable action buttons while waiting for text or callback input', async () => {
    const waitFor = vi.fn().mockResolvedValue({ message: { text: 'cancelled' } });
    runFormMock.mockImplementation(async (_input, deps) => {
      await deps.renderPrompt?.(
        {
          formId: 'bot-management-registration',
          fieldIndex: 1,
          previousValue: undefined,
        },
        {
          fieldType: 'ShortText',
          i18nKey: 'bot-management.create.prompt.display_name',
        },
      );
      return err(new AppError('input-engine.form.cancelled'));
    });

    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runBotRegistrationConversation({ waitFor } as never, ctx as never);

    expect(ctx.reply).toHaveBeenCalledWith(
      'bot-management.create.prompt.display_name',
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      }),
    );
    expect(waitFor).toHaveBeenCalledWith(['message:text', 'callback_query:data']);
  });
});
