import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UX_ERRORS } from '../ux.errors.js';
import { decodeWithExpiry } from '../callback-data/callback-data.encoder.js';

/** Check whether callback data with an expiry timestamp has expired */
export function isExpired(callbackData: string): Result<boolean, AppError> {
  return decodeWithExpiry(callbackData).map(
    (decoded) => Math.floor(Date.now() / 1000) >= decoded.expiresAt,
  );
}

/** Validate that callback data has not expired; returns err if expired */
export function checkExpiry(callbackData: string): Result<void, AppError> {
  return isExpired(callbackData).andThen((expired) => {
    if (expired) {
      return err(new AppError(UX_ERRORS.CONFIRMATION_EXPIRED));
    }
    return ok(undefined);
  });
}
