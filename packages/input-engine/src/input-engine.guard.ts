import { err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from './input-engine.errors.js';

/** Toggle guard — wraps async operations with enabled check (Rule XVI) */
export function guardEnabled<T>(
  enabled: boolean,
  fn: () => AsyncResult<T, AppError>,
): AsyncResult<T, AppError> {
  if (!enabled) {
    return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.DISABLED)));
  }
  return fn();
}
