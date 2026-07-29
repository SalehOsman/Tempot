import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from '../ai-core.errors.js';

export function normalizeEmbeddingVector(
  vector: readonly number[],
  dimensions: number,
): Result<number[], AppError> {
  if (vector.length === dimensions) return ok([...vector]);
  if (vector.length < dimensions)
    return ok([...vector, ...Array(dimensions - vector.length).fill(0)]);
  return err(
    new AppError(AI_ERRORS.EMBEDDING_DIMENSION_MISMATCH, {
      actual: vector.length,
      expected: dimensions,
    }),
  );
}
