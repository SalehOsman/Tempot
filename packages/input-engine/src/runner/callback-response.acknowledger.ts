import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import { extractCallbackData } from '../utils/callback-data.helper.js';

interface ConversationExternal {
  external?: <T>(fn: () => Promise<T>) => Promise<T>;
}

interface AnswerableCallbackContext {
  answerCallbackQuery: (options?: {
    readonly text?: string;
    readonly show_alert?: boolean;
  }) => Promise<unknown>;
}

/** Acknowledge Telegram callback updates so inline buttons visibly respond. */
export async function acknowledgeCallbackResponse(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  response: unknown,
): Promise<void> {
  if (!extractCallbackData(response) || !canAnswerCallback(response)) return;

  const conversation = input.conversation as ConversationExternal;
  try {
    if (conversation.external) {
      await conversation.external(() => response.answerCallbackQuery());
      return;
    }
    await response.answerCallbackQuery();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const logPayload = {
      msg: 'Callback query acknowledgement failed',
      errorMessage: message,
    };
    if (isExpiredCallbackError(message)) {
      deps.logger.debug(logPayload);
      return;
    }
    deps.logger.warn(logPayload);
  }
}

function canAnswerCallback(response: unknown): response is AnswerableCallbackContext {
  return (
    response !== null &&
    typeof response === 'object' &&
    typeof (response as { answerCallbackQuery?: unknown }).answerCallbackQuery === 'function'
  );
}

function isExpiredCallbackError(message: string): boolean {
  return message.includes('query is too old') || message.includes('query ID is invalid');
}
