import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Default maximum length for a single tag */
const DEFAULT_MAX_TAG_LENGTH = 50;

const FIELD_TYPE = 'Tags' as const;

/** Check each tag's length against the max */
function checkTagLength(tags: string[], maxTagLength: number): Result<void, AppError> {
  const tooLongTag = tags.find((tag) => tag.length > maxTagLength);
  if (tooLongTag) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.TAGS_MAX_LENGTH, {
        fieldType: FIELD_TYPE,
        reason: 'Tag exceeds maximum length',
        maxTagLength,
        tag: tooLongTag,
      }),
    );
  }
  return ok(undefined);
}

/** Check for case-insensitive duplicate tags */
function checkDuplicates(tags: string[]): Result<void, AppError> {
  const seen = new Set<string>();
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (seen.has(lower)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.TAGS_DUPLICATE, {
          fieldType: FIELD_TYPE,
          reason: 'Duplicate tag found',
          tag,
        }),
      );
    }
    seen.add(lower);
  }
  return ok(undefined);
}

/** Check tag count against min/max constraints */
function checkTagCount(tags: string[], metadata: FieldMetadata): Result<void, AppError> {
  const minTags = metadata.minTags ?? 0;
  const maxTags = metadata.maxTags ?? Infinity;

  if (tags.length < minTags) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType: FIELD_TYPE,
        reason: 'Too few tags',
        minTags,
        actual: tags.length,
      }),
    );
  }

  if (tags.length > maxTags) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType: FIELD_TYPE,
        reason: 'Too many tags',
        maxTags,
        actual: tags.length,
      }),
    );
  }

  return ok(undefined);
}

export class TagsFieldHandler implements FieldHandler {
  readonly fieldType = FIELD_TYPE;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string };
    if (!msg.text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text in message',
        }),
      );
    }
    return ok(msg.text.trim());
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    if (!Array.isArray(value)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value is not an array',
          value,
        }),
      );
    }

    const tags = value as string[];
    const maxTagLength = metadata.maxTagLength ?? DEFAULT_MAX_TAG_LENGTH;

    const lengthResult = checkTagLength(tags, maxTagLength);
    if (lengthResult.isErr()) return lengthResult;

    const dupResult = checkDuplicates(tags);
    if (dupResult.isErr()) return dupResult;

    const countResult = checkTagCount(tags, metadata);
    if (countResult.isErr()) return countResult;

    return ok(tags);
  }
}
