import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { cmsCacheKey } from './cms-cache-key.js';
import { CMS_ENGINE_ERRORS } from './cms-engine.errors.js';
import type { CmsUpdateDeps } from './cms-engine.ports.js';
import type {
  CmsRollbackRequest,
  CmsTranslationIdentity,
  CmsTranslationOverride,
  CmsTranslationStaticEntry,
  CmsUpdateRequest,
} from './cms-engine.types.js';
import { validateCmsPlaceholders } from './cms-placeholder.policy.js';
import { sanitizeCmsValue } from './cms-sanitizer.policy.js';
import { isDynamicCmsEnabled } from './cms-toggle.js';

export class CmsUpdateService {
  constructor(private readonly deps: CmsUpdateDeps) {}

  async update(request: CmsUpdateRequest): AsyncResult<CmsTranslationOverride> {
    if (!isDynamicCmsEnabled(this.deps.dynamicCmsEnabled)) {
      return err(new AppError(CMS_ENGINE_ERRORS.DISABLED));
    }

    const loaded = await this.loadStaticAndExisting(request);
    if (loaded.isErr()) return err(loaded.error);
    const { existing, staticEntry } = loaded.value;

    const checked = validateUpdate(staticEntry, request.value);
    if (checked.isErr()) return err(checked.error);

    const override = buildOverride({
      request,
      staticEntry,
      existing,
      updatedAt: this.deps.now(),
    });
    const saved = await this.deps.store.upsertOverride(override);
    if (saved.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.OVERRIDE_WRITE_FAILED));

    const propagated = await this.propagate(request, staticEntry, saved.value);
    if (propagated.isErr()) return err(propagated.error);
    return ok(saved.value);
  }

  async rollbackToPrevious(request: CmsRollbackRequest): AsyncResult<CmsTranslationOverride> {
    const existing = await this.deps.store.findOverride(request);
    if (existing.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.OVERRIDE_READ_FAILED));
    if (!existing.value?.previousValue) {
      return err(new AppError(CMS_ENGINE_ERRORS.ROLLBACK_UNAVAILABLE));
    }
    return this.update({ ...request, value: existing.value.previousValue });
  }

  private async loadStaticAndExisting(identity: CmsTranslationIdentity) {
    const staticEntry = await this.deps.staticCatalog.findStatic(identity);
    if (staticEntry.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.STATIC_READ_FAILED));
    if (!staticEntry.value) return err(new AppError(CMS_ENGINE_ERRORS.MISSING_KEY));

    const existing = await this.deps.store.findOverride(identity);
    if (existing.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.OVERRIDE_READ_FAILED));
    return ok({ staticEntry: staticEntry.value, existing: existing.value });
  }

  private async propagate(
    request: CmsUpdateRequest,
    staticEntry: CmsTranslationStaticEntry,
    saved: CmsTranslationOverride,
  ) {
    const cache = await this.deps.cache.delete(cmsCacheKey(request));
    if (cache.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.CACHE_INVALIDATION_FAILED));

    const event = await this.deps.events.publishTranslationUpdated(toEventPayload(saved));
    if (event.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.EVENT_PUBLISH_FAILED));

    const audit = await this.deps.audit.recordTranslationMutation(
      toAudit(request, staticEntry, saved),
    );
    if (audit.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.AUDIT_FAILED));
    return ok(undefined);
  }
}

function validateUpdate(staticEntry: CmsTranslationStaticEntry, value: string) {
  if (staticEntry.protection === 'locked') {
    return err(new AppError(CMS_ENGINE_ERRORS.PROTECTED_KEY));
  }
  return validateCmsPlaceholders(staticEntry.value, value);
}

interface BuildOverrideInput {
  request: CmsUpdateRequest;
  staticEntry: CmsTranslationStaticEntry;
  existing: CmsTranslationOverride | undefined;
  updatedAt: string;
}

function buildOverride(input: BuildOverrideInput): CmsTranslationOverride {
  const { existing, request, staticEntry, updatedAt } = input;
  return {
    namespace: request.namespace,
    key: request.key,
    locale: request.locale,
    value: sanitizeCmsValue(request.value, staticEntry.format),
    previousValue: existing?.value ?? staticEntry.value,
    updatedBy: request.updatedBy,
    updatedAt,
    protection: staticEntry.protection,
  };
}

function toEventPayload(saved: CmsTranslationOverride) {
  return {
    namespace: saved.namespace,
    key: saved.key,
    locale: saved.locale,
    updatedBy: saved.updatedBy,
    updatedAt: saved.updatedAt,
  };
}

function toAudit(
  request: CmsUpdateRequest,
  staticEntry: CmsTranslationStaticEntry,
  saved: CmsTranslationOverride,
) {
  return {
    namespace: saved.namespace,
    key: saved.key,
    locale: saved.locale,
    beforeValue: saved.previousValue ?? staticEntry.value,
    afterValue: saved.value,
    changedBy: saved.updatedBy,
    changedAt: saved.updatedAt,
    reason: request.reason,
  };
}
