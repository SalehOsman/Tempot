import crypto from 'node:crypto';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';

/** Callback data prefix for input-engine */
const CALLBACK_PREFIX = 'ie';

/** Minimum number of segments in valid callback data (prefix + formId + fieldIndex + value) */
const MIN_SEGMENT_COUNT = 4;

/** Decoded callback data structure */
export interface FormCallbackData {
  formId: string;
  fieldIndex: number;
  value: string;
}

/** Encode form callback data into the standard `ie:{formId}:{fieldIndex}:{value}` format */
export function encodeFormCallback(formId: string, fieldIndex: number, value: string): string {
  return `${CALLBACK_PREFIX}:${formId}:${String(fieldIndex)}:${value}`;
}

/** Decode a callback data string into its constituent parts */
export function decodeFormCallback(data: string): Result<FormCallbackData, AppError> {
  const parts = data.split(':');

  if (parts[0] !== CALLBACK_PREFIX) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        reason: 'Invalid callback data prefix',
        data,
      }),
    );
  }

  if (parts.length < MIN_SEGMENT_COUNT) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        reason: 'Callback data missing segments',
        data,
      }),
    );
  }

  const fieldIndex = Number(parts[2]);
  if (Number.isNaN(fieldIndex)) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        reason: 'Invalid fieldIndex — must be numeric',
        data,
      }),
    );
  }

  const formId = parts[1];
  // Value may contain colons, so rejoin everything after the 3rd colon
  const value = parts.slice(3).join(':');

  return ok({ formId, fieldIndex, value });
}

/** Generate a short unique form ID (8 characters from UUID) */
export function generateFormId(): string {
  return crypto.randomUUID().slice(0, 8);
}
