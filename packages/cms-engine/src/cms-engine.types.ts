export type CmsContentFormat = 'markdown' | 'plain' | 'telegram_html';
export type CmsProtectionPolicy = 'editable' | 'locked' | 'requires_review' | 'super_admin_only';
export type CmsResolutionSource = 'cache' | 'fallback_static' | 'override' | 'static';
export type CmsAiReviewStatus = 'approved' | 'blocked' | 'changes_requested';
export type CmsPlaceholderStatus = 'extra' | 'missing' | 'present';

export interface CmsTranslationIdentity {
  namespace: string;
  key: string;
  locale: string;
  fallbackLocale?: string;
}

export interface CmsTranslationStaticEntry {
  namespace: string;
  key: string;
  locale: string;
  value: string;
  format: CmsContentFormat;
  protection: CmsProtectionPolicy;
}

export interface CmsTranslationOverride {
  namespace: string;
  key: string;
  locale: string;
  value: string;
  previousValue?: string;
  updatedBy: string;
  updatedAt: string;
  protection: CmsProtectionPolicy;
}

export interface CmsResolution {
  namespace: string;
  key: string;
  locale: string;
  value: string;
  source: CmsResolutionSource;
  messageKeys: string[];
}

export interface CmsUpdateRequest extends CmsTranslationIdentity {
  value: string;
  updatedBy: string;
  reason?: string;
}

export interface CmsRollbackRequest extends CmsTranslationIdentity {
  updatedBy: string;
  reason?: string;
}

export interface CmsTranslationUpdatedPayload {
  namespace: string;
  key: string;
  locale: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CmsAuditEntry {
  namespace: string;
  key: string;
  locale: string;
  beforeValue?: string;
  afterValue: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface CmsAiSuggestion {
  value: string;
  reason: string;
}

export interface CmsPlaceholderFinding {
  name: string;
  status: CmsPlaceholderStatus;
}

export interface CmsAiReviewRequest {
  namespace: string;
  key: string;
  locale: string;
  fallbackLocale?: string;
  sourceValue: string;
  draftValue: string;
  format: CmsContentFormat;
  protection: CmsProtectionPolicy;
  context?: Record<string, string>;
}

export interface CmsAiReviewReport {
  status: CmsAiReviewStatus;
  suggestions: CmsAiSuggestion[];
  riskFlags: string[];
  placeholderFindings: CmsPlaceholderFinding[];
  messageKeys: string[];
}
