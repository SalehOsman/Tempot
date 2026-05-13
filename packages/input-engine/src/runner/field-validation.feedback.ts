import type { AppError } from '@tempot/shared';
import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import type { FieldContext } from './field.processor.js';
import { renderValidationError } from './validation-error.renderer.js';
import { logFieldValidationFailed } from './field.lifecycle-logger.js';

interface ReplyCapableContext {
  reply: (text: string) => Promise<unknown>;
}

function hasReply(ctx: unknown): ctx is ReplyCapableContext {
  return typeof (ctx as { reply?: unknown }).reply === 'function';
}

async function sendValidationFeedback(input: FormRunnerInput, errorText: string): Promise<void> {
  const conversation = input.conversation as {
    external?: <T>(fn: () => Promise<T>) => Promise<T>;
  };
  const replyContext = input.ctx;
  if (!conversation.external || !hasReply(replyContext)) return;
  await conversation.external(() => replyContext.reply(errorText));
}

interface ValidationFailureParams {
  input: FormRunnerInput;
  ctx: FieldContext;
  deps: FormRunnerDeps;
  details: { retryCount: number; error: AppError };
}

export async function handleValidationFailure(params: ValidationFailureParams): Promise<void> {
  const { input, ctx, deps, details } = params;
  await logFieldValidationFailed({
    input,
    deps,
    ctx,
    attempt: details.retryCount,
    errorCode: details.error.code,
  });
  const errorText = renderValidationError(
    ctx.metadata,
    { current: details.retryCount, max: ctx.maxRetries },
    deps.t,
  );
  deps.logger.debug({ msg: 'Validation error', errorText, fieldName: ctx.fieldName });
  await sendValidationFeedback(input, errorText);
}
