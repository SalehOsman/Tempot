import { describe, expect, it } from 'vitest';
import {
  CMS_ENGINE_ERRORS,
  CMS_ENGINE_MESSAGE_KEYS,
  cmsCacheKey,
  extractCmsPlaceholders,
} from '../../src/index.js';
import type {
  CmsAiReviewReport,
  CmsProtectionPolicy,
  CmsResolution,
  CmsTranslationOverride,
} from '../../src/index.js';

describe('CMS engine public contracts', () => {
  it('should expose stable errors, message keys, cache keys, and core value contracts', () => {
    const policy: CmsProtectionPolicy = 'requires_review';
    const override: CmsTranslationOverride = {
      namespace: 'common',
      key: 'welcome',
      locale: 'ar',
      value: 'Welcome {{name}}',
      previousValue: 'Hi {{name}}',
      updatedBy: 'admin-1',
      updatedAt: '2026-05-06T00:00:00.000Z',
      protection: policy,
    };
    const resolution: CmsResolution = {
      namespace: override.namespace,
      key: override.key,
      locale: override.locale,
      value: override.value,
      source: 'override',
      messageKeys: [],
    };
    const report: CmsAiReviewReport = {
      status: 'changes_requested',
      suggestions: [{ value: 'Welcome, {{name}}', reason: 'cms.ai.reason.clarity' }],
      riskFlags: ['placeholder'],
      placeholderFindings: [{ name: 'name', status: 'present' }],
      messageKeys: [],
    };

    expect(CMS_ENGINE_ERRORS.PLACEHOLDER_MISMATCH).toBe('cms-engine.placeholder_mismatch');
    expect(CMS_ENGINE_MESSAGE_KEYS.MISSING_KEY).toBe('cms_engine.translation.missing_key');
    expect(cmsCacheKey({ namespace: 'common', key: 'welcome', locale: 'ar' })).toBe(
      'cms:ar:common:welcome',
    );
    expect(extractCmsPlaceholders('Hello {{ name }} and {{count}}')).toEqual(['count', 'name']);
    expect(resolution.value).toBe('Welcome {{name}}');
    expect(report.suggestions[0]?.reason).toBe('cms.ai.reason.clarity');
  });
});
