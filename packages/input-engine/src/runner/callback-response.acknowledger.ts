import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import { extractCallbackData } from '../utils/callback-data.helper.js';

const CALLBACK_ACK_TIMEOUT_MS = 1_500;

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

  try {
    await runAckWithTimeout(response.answerCallbackQuery(), deps);
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

async function runAckWithTimeout(task: Promise<unknown>, deps: FormRunnerDeps): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const completion = task.then(
    () => ({ status: 'done' as const }),
    (error: unknown) => ({ status: 'failed' as const, error }),
  );
  const timeout = new Promise<{ status: 'timeout' }>((resolve) => {
    timeoutId = setTimeout(() => resolve({ status: 'timeout' }), CALLBACK_ACK_TIMEOUT_MS);
  });
  const result = await Promise.race([completion, timeout]);
  if (timeoutId) clearTimeout(timeoutId);
  if (result.status === 'timeout') {
    deps.logger.warn({
      code: 'input-engine.callback_ack_timeout',
      timeoutMs: CALLBACK_ACK_TIMEOUT_MS,
    });
    return;
  }
  if (result.status === 'failed') throw result.error;
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
