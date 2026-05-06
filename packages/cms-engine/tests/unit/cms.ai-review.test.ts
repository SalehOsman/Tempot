import { ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import { CMS_ENGINE_ERRORS, CmsAiReviewService } from '../../src/index.js';
import type { CmsAiReviewerPort } from '../../src/index.js';

const request = {
  namespace: 'common',
  key: 'welcome',
  locale: 'ar',
  fallbackLocale: 'en',
  sourceValue: 'Hello {{name}}',
  draftValue: 'Hello',
  format: 'plain',
  protection: 'editable',
  context: { module: 'user-management' },
} as const;

describe('CmsAiReviewService', () => {
  it('should return a typed error when no AI reviewer port is configured', async () => {
    const result = await new CmsAiReviewService({}).reviewDraft(request);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(CMS_ENGINE_ERRORS.AI_REVIEWER_MISSING);
  });

  it('should call only the injected AI reviewer and merge deterministic placeholder findings', async () => {
    const reviewer: CmsAiReviewerPort = {
      reviewDraft: vi.fn(async () =>
        ok({
          status: 'changes_requested',
          suggestions: [{ value: 'Hello {{name}}', reason: 'cms.ai.reason.placeholder' }],
          riskFlags: ['tone'],
          placeholderFindings: [],
          messageKeys: [],
        }),
      ),
    };
    const result = await new CmsAiReviewService({ reviewer }).reviewDraft(request);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(reviewer.reviewDraft).toHaveBeenCalledWith(request);
    expect(result.value.placeholderFindings).toEqual([{ name: 'name', status: 'missing' }]);
    expect(result.value.status).toBe('changes_requested');
  });
});
