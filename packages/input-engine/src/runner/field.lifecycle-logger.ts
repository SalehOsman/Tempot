import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import type { FieldContext } from './field.processor.js';
import { runConversationSideEffect } from './conversation-side-effect.runner.js';

interface FieldLogParams {
  input: FormRunnerInput;
  deps: FormRunnerDeps;
  ctx: FieldContext;
}

interface FieldAttemptLogParams extends FieldLogParams {
  attempt: number;
}

interface ValidationFailureLogParams extends FieldAttemptLogParams {
  errorCode: string;
}

function payload(ctx: FieldContext, extra?: Record<string, unknown>): object {
  return {
    formId: ctx.formId,
    fieldName: ctx.fieldName,
    fieldType: ctx.metadata.fieldType,
    fieldIndex: ctx.fieldIndex,
    ...extra,
  };
}

export async function logFieldStarted(params: FieldLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.debug({
      code: 'input-engine.field_started',
      ...payload(params.ctx, { maxRetries: params.ctx.maxRetries }),
    });
  });
}

export async function logFieldCancelled(params: FieldAttemptLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.info({
      code: 'input-engine.field_cancelled',
      ...payload(params.ctx, { attempt: params.attempt }),
    });
  });
}

export async function logFieldBack(params: FieldAttemptLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.info({
      code: 'input-engine.field_back',
      ...payload(params.ctx, { attempt: params.attempt }),
    });
  });
}

export async function logFieldKeepCurrent(params: FieldAttemptLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.info({
      code: 'input-engine.field_keep_current',
      ...payload(params.ctx, { attempt: params.attempt }),
    });
  });
}

export async function logFieldValidated(params: FieldLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.info({
      code: 'input-engine.field_validated',
      ...payload(params.ctx, { retryCount: params.ctx.retryCount }),
    });
  });
}

export async function logFieldMaxRetries(params: FieldLogParams): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.error({
      code: 'input-engine.field_max_retries',
      ...payload(params.ctx, { maxRetries: params.ctx.maxRetries }),
    });
  });
}

export async function logFieldValidationFailed(
  params: ValidationFailureLogParams,
): Promise<void> {
  await runConversationSideEffect(params.input, () => {
    params.deps.logger.warn({
      code: 'input-engine.field_validation_failed',
      ...payload(params.ctx, {
        attempt: params.attempt,
        maxRetries: params.ctx.maxRetries,
        errorCode: params.errorCode,
      }),
    });
  });
}
