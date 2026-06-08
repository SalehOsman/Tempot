import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BotHealthStatus, BotRuntimeMode } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

const { refreshAndEnforceMock, runFormMock, transitionMock } = vi.hoisted(() => ({
  refreshAndEnforceMock: vi.fn(),
  runFormMock: vi.fn(),
  transitionMock: vi.fn(),
}));

vi.mock('@tempot/input-engine', () => ({
  buildActionButtons: () => [
    {
      buttons: [
        {
          text: 'input-engine.actions.cancel',
          callbackData: 'ie:bot-management-lifecycle-reason:0:__cancel__',
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
  getAuthorization: () => ({
    refreshAndEnforce: refreshAndEnforceMock,
  }),
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../services/lifecycle-service.context.js', () => ({
  getLifecycleService: () => ({
    transition: transitionMock,
  }),
}));

vi.mock('../../menus/bot-detail.factory.js', () => ({
  formatBotDetailMessage: () => 'bot detail',
}));

vi.mock('../../menus/bot-menu.factory.js', () => ({
  createBotDetailMenu: () => ({ inline_keyboard: [] }),
}));

import { runLifecycleReasonConversation } from '../../flows/lifecycle-reason.flow.js';

const managedBot = {
  id: 'bot-1',
  displayName: 'Support Bot',
  telegramUsername: 'support_bot',
  tokenFingerprint: 'fingerprint',
  tokenRedacted: '1234567...abcd',
  ownerId: '123',
  runtimeMode: BotRuntimeMode.POLLING,
  status: BotLifecycleStatus.PAUSED,
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

describe('runLifecycleReasonConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshAndEnforceMock.mockResolvedValue(true);
  });

  it('collects a reason through input-engine and delegates to LifecycleService', async () => {
    runFormMock.mockResolvedValue(ok({ reason: ' Operational pause ' }));
    transitionMock.mockResolvedValue(ok(managedBot));
    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runLifecycleReasonConversation({} as never, ctx as never, {
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
    });

    expect(transitionMock).toHaveBeenCalledWith({
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
      actorId: '123',
      reason: 'Operational pause',
    });
    expect(ctx.reply).toHaveBeenCalledWith('bot detail', {
      reply_markup: { inline_keyboard: [] },
    });
  });

  it('does not mutate lifecycle state when the shared reason form is cancelled', async () => {
    runFormMock.mockResolvedValue(err(new AppError('input-engine.form.cancelled')));
    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runLifecycleReasonConversation({} as never, ctx as never, {
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
    });

    expect(transitionMock).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('bot-management.lifecycle.reason_cancelled');
  });

  it('does not mutate lifecycle state when current authorization is denied at commit', async () => {
    runFormMock.mockResolvedValue(ok({ reason: 'Operational pause' }));
    refreshAndEnforceMock.mockResolvedValue(false);
    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runLifecycleReasonConversation({} as never, ctx as never, {
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
    });

    expect(refreshAndEnforceMock).toHaveBeenCalledWith(ctx, {
      module: 'bot-management',
      classification: 'protected',
      action: 'manage',
      subject: 'bot',
    });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it('renders reusable action buttons while waiting for text or callback input', async () => {
    const waitFor = vi.fn().mockResolvedValue({ message: { text: 'cancelled' } });
    runFormMock.mockImplementation(async (_input, deps) => {
      await deps.renderPrompt?.(
        {
          formId: 'bot-management-lifecycle-reason',
          fieldIndex: 0,
          previousValue: undefined,
        },
        {
          fieldType: 'ShortText',
          i18nKey: 'bot-management.lifecycle.reason_prompt',
        },
      );
      return err(new AppError('input-engine.form.cancelled'));
    });
    const ctx = {
      from: { id: 123 },
      chat: { id: 123 },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await runLifecycleReasonConversation({ waitFor } as never, ctx as never, {
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.PAUSED,
    });

    expect(ctx.reply).toHaveBeenCalledWith(
      'bot-management.lifecycle.reason_prompt',
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      }),
    );
    expect(waitFor).toHaveBeenCalledWith(['message:text', 'callback_query:data']);
  });
});
