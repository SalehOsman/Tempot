import type { AsyncResult } from '@tempot/shared';
import type {
  CmsAiReviewReport,
  CmsAiReviewRequest,
  CmsAuditEntry,
  CmsTranslationIdentity,
  CmsTranslationOverride,
  CmsTranslationStaticEntry,
  CmsTranslationUpdatedPayload,
} from './cms-engine.types.js';

export interface CmsCachePort {
  get(key: string): AsyncResult<string | undefined>;
  set(key: string, value: string, ttlSeconds: number): AsyncResult<void>;
  delete(key: string): AsyncResult<void>;
}

export interface CmsOverrideStorePort {
  findOverride(identity: CmsTranslationIdentity): AsyncResult<CmsTranslationOverride | undefined>;
  upsertOverride(override: CmsTranslationOverride): AsyncResult<CmsTranslationOverride>;
}

export interface CmsStaticCatalogPort {
  findStatic(identity: CmsTranslationIdentity): AsyncResult<CmsTranslationStaticEntry | undefined>;
}

export interface CmsEventPublisherPort {
  publishTranslationUpdated(payload: CmsTranslationUpdatedPayload): AsyncResult<void>;
}

export interface CmsAuditPort {
  recordTranslationMutation(entry: CmsAuditEntry): AsyncResult<void>;
}

export interface CmsAiReviewerPort {
  reviewDraft(request: CmsAiReviewRequest): AsyncResult<CmsAiReviewReport>;
}

export interface CmsResolutionDeps {
  cache: CmsCachePort;
  store: CmsOverrideStorePort;
  staticCatalog: CmsStaticCatalogPort;
  aiReviewer?: CmsAiReviewerPort;
  dynamicCmsEnabled?: boolean;
}

export interface CmsUpdateDeps {
  cache: CmsCachePort;
  store: CmsOverrideStorePort;
  staticCatalog: CmsStaticCatalogPort;
  events: CmsEventPublisherPort;
  audit: CmsAuditPort;
  dynamicCmsEnabled?: boolean;
  now: () => string;
}

export interface CmsAiReviewDeps {
  reviewer?: CmsAiReviewerPort;
}
