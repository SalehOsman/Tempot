import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import type { FieldContext } from './field.processor.js';
import { acknowledgeCallbackResponse } from './callback-response.acknowledger.js';
import { checkCancelSignal, isBackSignal, isKeepCurrentSignal } from './field-response.signals.js';
import {
  logFieldBack,
  logFieldCancelled,
  logFieldKeepCurrent,
} from './field.lifecycle-logger.js';

export interface ControlSignalParams {
  input: FormRunnerInput;
  ctx: FieldContext;
  deps: FormRunnerDeps;
  response: unknown;
  attempt: number;
}

export async function handleControlSignal(
  params: ControlSignalParams,
): Promise<Result<unknown, AppError> | undefined> {
  const { input, ctx, deps, response, attempt } = params;
  const cancelErr = checkCancelSignal(response, ctx);
  if (cancelErr) {
    await acknowledgeCallbackResponse(input, deps, response);
    await logFieldCancelled({ input, deps, ctx, attempt });
    return err(cancelErr);
  }
  if (isKeepCurrentSignal(response) && ctx.previousValue !== undefined) {
    await acknowledgeCallbackResponse(input, deps, response);
    ctx.retryCount = 0;
    await logFieldKeepCurrent({ input, deps, ctx, attempt });
    return ok(ctx.previousValue);
  }
  if (isBackSignal(response)) {
    await acknowledgeCallbackResponse(input, deps, response);
    await logFieldBack({ input, deps, ctx, attempt });
    return err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK, { fieldName: ctx.fieldName }));
  }
  return undefined;
}
