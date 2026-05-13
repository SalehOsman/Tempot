import { describe, expect, it, vi } from 'vitest';
import { acknowledgeCallbackResponse } from '../../src/runner/callback-response.acknowledger.js';
import type { FormRunnerDeps, FormRunnerInput } from '../../src/runner/form.runner.js';

function createDeps(): FormRunnerDeps {
  return {
    registry: {} as FormRunnerDeps['registry'],
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    eventBus: {} as FormRunnerDeps['eventBus'],
    isEnabled: () => true,
    getActiveConversation: () => undefined,
    setActiveConversation: vi.fn(),
    userId: 'user-1',
    chatId: 1,
  };
}

function createInput(external: ReturnType<typeof vi.fn>): FormRunnerInput {
  return {
    conversation: { external },
    ctx: {},
    schema: {} as FormRunnerInput['schema'],
  };
}

describe('acknowledgeCallbackResponse', () => {
  it('answers conversational callback queries without conversation.external replay wrapping', async () => {
    const external = vi.fn(async <T>(task: () => Promise<T>): Promise<T> => task());
    const answerCallbackQuery = vi.fn().mockResolvedValue(true);

    await acknowledgeCallbackResponse(createInput(external), createDeps(), {
      callbackQuery: { data: 'ie:test-form:2:__cancel__' },
      answerCallbackQuery,
    });

    expect(answerCallbackQuery).toHaveBeenCalledTimes(1);
    expect(external).not.toHaveBeenCalled();
  });
});
