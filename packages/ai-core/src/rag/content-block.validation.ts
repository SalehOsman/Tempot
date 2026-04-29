import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from '../ai-core.errors.js';
import type {
  ContentAccessPolicy,
  ContentBlock,
  ContentBlockEmbeddingPolicy,
  ContentSource,
  GroundedAnswer,
} from './content-block.types.js';
import type { Result } from '@tempot/shared';

const DEFAULT_EMBEDDING_POLICY: ContentBlockEmbeddingPolicy = {
  allowRawPII: false,
  allowedRawPIIBlockTypes: [],
};

export function validateContentSource(
  source: ContentSource,
): Result<ContentSource, AppError> {
  if (isBlank(source.id) || isBlank(source.originPackage)) {
    return invalidSource('identity');
  }

  if (isBlank(source.kind) || !hasAccessPolicy(source.accessPolicy)) {
    return invalidSource('required_fields');
  }

  return ok(source);
}

export function validateContentBlock(
  block: ContentBlock,
): Result<ContentBlock, AppError> {
  if (isBlank(block.id) || isBlank(block.sourceId) || isBlank(block.blockType)) {
    return invalidBlock('identity');
  }

  if (!Number.isInteger(block.sequence) || block.sequence < 0) {
    return invalidBlock('sequence');
  }

  if (!isPlainRecord(block.metadata) || !hasAccessPolicy(block.accessPolicy)) {
    return invalidBlock('metadata_or_access');
  }

  if (!isConfidence(block.extractionConfidence) || !hasContentPayload(block)) {
    return invalidBlock('confidence_or_payload');
  }

  return ok(block);
}

export function validateEmbeddableContentBlock(
  block: ContentBlock,
  policy: ContentBlockEmbeddingPolicy = DEFAULT_EMBEDDING_POLICY,
): Result<ContentBlock, AppError> {
  const validation = validateContentBlock(block);
  if (validation.isErr()) return validation;

  if (isRawPIIBlocked(block, policy)) {
    return err(new AppError(AI_ERRORS.CONTENT_BLOCK_RAW_PII, { blockId: block.id }));
  }

  if (isBlank(block.text)) {
    return err(new AppError(AI_ERRORS.CONTENT_BLOCK_NOT_EMBEDDABLE, { blockId: block.id }));
  }

  return ok(block);
}

export function validateGroundedAnswer(
  answer: GroundedAnswer,
): Result<GroundedAnswer, AppError> {
  if (isBlank(answer.answerId) || isBlank(answer.state) || !isConfidence(answer.confidence)) {
    return invalidGrounding('identity_or_confidence');
  }

  if (answer.state === 'answered' && answer.citations.length === 0) {
    return invalidGrounding('missing_citations');
  }

  if (answer.state !== 'answered' && isBlank(answer.messageKey)) {
    return invalidGrounding('missing_message_key');
  }

  return ok(answer);
}

function invalidSource(reason: string): Result<ContentSource, AppError> {
  return err(new AppError(AI_ERRORS.CONTENT_SOURCE_INVALID, { reason }));
}

function invalidBlock(reason: string): Result<ContentBlock, AppError> {
  return err(new AppError(AI_ERRORS.CONTENT_BLOCK_INVALID, { reason }));
}

function invalidGrounding(reason: string): Result<GroundedAnswer, AppError> {
  return err(new AppError(AI_ERRORS.RAG_GROUNDING_INVALID, { reason }));
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

function isConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function hasContentPayload(block: ContentBlock): boolean {
  return !isBlank(block.text) || !isBlank(block.binaryRef?.storageKey);
}

function hasAccessPolicy(policy: ContentAccessPolicy | undefined): boolean {
  return policy !== undefined && !isBlank(policy.policyId) && !isBlank(policy.scope);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRawPIIBlocked(
  block: ContentBlock,
  policy: ContentBlockEmbeddingPolicy,
): boolean {
  if (block.piiState !== 'raw') return false;
  if (policy.allowRawPII !== true) return true;
  return !policy.allowedRawPIIBlockTypes?.includes(block.blockType);
}
