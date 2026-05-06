import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { CMS_ENGINE_ERRORS } from './cms-engine.errors.js';
import type { CmsAiReviewDeps } from './cms-engine.ports.js';
import type { CmsAiReviewReport, CmsAiReviewRequest } from './cms-engine.types.js';
import { compareCmsPlaceholders } from './cms-placeholder.policy.js';

export class CmsAiReviewService {
  constructor(private readonly deps: CmsAiReviewDeps) {}

  async reviewDraft(request: CmsAiReviewRequest): AsyncResult<CmsAiReviewReport> {
    if (!this.deps.reviewer) return err(new AppError(CMS_ENGINE_ERRORS.AI_REVIEWER_MISSING));

    const reviewed = await this.deps.reviewer.reviewDraft(request);
    if (reviewed.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.AI_REVIEW_FAILED));

    return ok({
      ...reviewed.value,
      placeholderFindings: mergeFindings(
        compareCmsPlaceholders(request.sourceValue, request.draftValue),
        reviewed.value.placeholderFindings,
      ),
    });
  }
}

function mergeFindings(
  local: CmsAiReviewReport['placeholderFindings'],
  remote: CmsAiReviewReport['placeholderFindings'],
): CmsAiReviewReport['placeholderFindings'] {
  const byName = new Map<string, CmsAiReviewReport['placeholderFindings'][number]>();
  for (const finding of remote) byName.set(finding.name, finding);
  for (const finding of local) byName.set(finding.name, finding);
  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}
