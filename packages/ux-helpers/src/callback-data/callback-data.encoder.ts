import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UX_ERRORS } from '../errors.js';
import { CALLBACK_SEPARATOR, MAX_CALLBACK_BYTES } from '../constants.js';
import type { DecodedCallbackWithExpiry } from '../types.js';

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/** Encode an array of parts into a colon-separated callback data string */
export function encodeCallbackData(parts: readonly string[]): Result<string, AppError> {
  if (parts.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  const encoded = parts.join(CALLBACK_SEPARATOR);
  const byteLength = getByteLength(encoded);

  if (byteLength > MAX_CALLBACK_BYTES) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_TOO_LONG, {
        byteLength,
        maxBytes: MAX_CALLBACK_BYTES,
      }),
    );
  }

  return ok(encoded);
}

/** Decode a colon-separated callback data string into an array of parts */
export function decodeCallbackData(data: string): Result<readonly string[], AppError> {
  if (data.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  return ok(data.split(CALLBACK_SEPARATOR));
}

/** Encode parts with an appended expiry timestamp */
export function encodeWithExpiry(
  parts: readonly string[],
  expiryMinutes: number,
): Result<string, AppError> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
  const allParts = [...parts, String(expiresAt)];
  return encodeCallbackData(allParts);
}

/** Decode callback data that includes an expiry timestamp as the last part */
export function decodeWithExpiry(data: string): Result<DecodedCallbackWithExpiry, AppError> {
  if (data.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  const allParts = data.split(CALLBACK_SEPARATOR);

  if (allParts.length < 2) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_DECODE_FAILED, {
        reason: 'Expected at least 2 parts (data + expiry)',
      }),
    );
  }

  const expiryStr = allParts[allParts.length - 1]!;
  const expiresAt = parseInt(expiryStr, 10);

  if (isNaN(expiresAt)) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_DECODE_FAILED, {
        reason: 'Last part is not a valid timestamp',
      }),
    );
  }

  const parts = allParts.slice(0, -1);
  return ok({ parts, expiresAt });
}
