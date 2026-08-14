import { err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from './ai-core.errors.js';

/** Guard function — checks if AI is enabled before executing (Rule XVI) */
export function guardEnabled<T>(
  enabled: boolean,
  fn: () => AsyncResult<T, AppError>,
): AsyncResult<T, AppError> {
  if (!enabled) {
    return Promise.resolve(err(new AppError(AI_ERRORS.DISABLED)));
  }
  return fn();
}
