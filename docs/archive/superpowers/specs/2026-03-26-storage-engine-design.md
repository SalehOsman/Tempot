# Storage Engine (010) — Design Deepening

**Date**: 2026-03-26
**Phase**: Brainstorming (Superpowers)
**Input**: `specs/010-storage-engine-package/spec.md` (Clarified), `plan.md`, `tasks.md`

---

## Design Concern 1: ValidationService — Sync vs Async Split

### Context

`ValidationService` exposes two validation methods with different signatures:

- `validateUpload(options: UploadOptions): Result<ValidatedFile, AppError>` — synchronous
- `validateMimeType(data: Buffer, declaredMime: string): AsyncResult<void, AppError>` — async

`StorageService.upload()` calls `validateUpload()` first, then conditionally calls `validateMimeType()` only when `data` is a `Buffer`. Stream data skips MIME magic byte detection entirely.

### Analysis

**Why the split is correct:**

1. **Streams are not bufferable at this layer.** `file-type` requires a `Buffer` (specifically the first 4100+ bytes) to perform magic byte detection. Buffering a `Readable` stream would violate NFR-005 ("never load entire file into memory") and would consume the stream, making it unreadable for the subsequent provider upload. The caller (API/bot layer) decides whether to pass a `Buffer` or `Readable` — storage-engine must respect that decision.

2. **Fail-fast semantics.** The synchronous validations (size, MIME allowlist, filename sanitization) are cheap and deterministic. Running them first avoids the cost of `fileTypeFromBuffer()` (which reads and analyzes binary headers) when the upload would fail anyway. This satisfies NFR-001 (upload latency < 500ms).

3. **Separation of concerns.** `validateUpload()` checks metadata correctness (what the caller _claims_ about the file). `validateMimeType()` checks content correctness (what the file _actually is_). These are fundamentally different operations — one is a policy check, the other is a security check.

**Tradeoff: Streams bypass MIME spoofing detection.** When the API layer passes a `Readable` stream (typical for files > 1MB per NFR-005), the magic byte check is skipped entirely. An attacker could declare `image/jpeg` but stream a `.exe`. However:

- The spec explicitly states that `hono/body-limit` enforcement happens at the API/bot layer (ADR-022), not in storage-engine.
- The MIME allowlist check in `validateUpload()` still blocks disallowed MIME _types_. The risk is mismatch, not bypass — the attacker can only claim an _allowed_ MIME type.
- For high-security use cases, the API layer should buffer small files (< 1MB, which NFR-005 permits) and pass them as `Buffer`.

### Recommendation

**Keep the split as designed.** The sync/async boundary is correct and intentional.

Add a JSDoc comment on `validateMimeType()` documenting that it is only called for `Buffer` data, and add a comment in `StorageService.upload()` explaining _why_ streams skip magic byte detection (referencing NFR-005).

### Affected Tasks/Files

- **Task 2** (`validation.service.ts`): Add JSDoc on `validateMimeType()` explaining the Buffer-only constraint.
- **Task 9** (`storage.service.ts`): Add inline comment at the `if (Buffer.isBuffer(data))` branch explaining the NFR-005 rationale.
- No structural changes required.

---

## Design Concern 2: Provider Error Wrapping Strategy

### Context

All three providers follow the same pattern:

```typescript
catch (error: unknown) {
  return err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED, error));
}
```

`AppError` stores the original error in `details?: unknown`. The question: what information is preserved, and should we log the original error before wrapping?

### Analysis

**What `AppError` preserves:**

Looking at `packages/shared/src/errors.ts`, `AppError` stores the original error in the `details` field. This preserves the full original error object (message, stack trace, AWS-specific error codes, HTTP status codes, etc.) — it is _not_ discarded.

**Should we log before wrapping?**

No. Constitution Rule XXIII ("No Double Logging") with the `loggedAt` mechanism is designed specifically for this scenario. The error should be logged _once_ at the point where it is handled (typically the service layer or the caller), not at the point where it is created. Logging at the provider level _and_ at the service level would violate Rule XXIII.

However, the `loggedAt` flag on `AppError` must be checked by whatever logs the error. The current plan does not show any explicit logging of failed operations in `StorageService`. The caller of `StorageService.upload()` receives the `AppError` and is responsible for logging it.

**What should be preserved from the original error:**

For AWS SDK errors: `error.name` (e.g., `NoSuchKey`, `AccessDenied`), `error.$metadata?.httpStatusCode`, `error.message`. For Google Drive errors: `error.code`, `error.errors[]`, `error.message`. For filesystem errors: `error.code` (e.g., `ENOENT`, `EACCES`, `ENOSPC`), `error.message`.

Since `AppError.details` accepts `unknown` and stores the full original error, all of this information is already preserved. No transformation is needed.

**The real concern: `AppError` constructor receives `error` as `unknown`.** If the caller logs `appError.details`, they get the original error object intact. If they serialize it (e.g., for Pino structured logging), the standard `JSON.stringify()` on an `Error` object produces `{}` (Error properties are non-enumerable). This is a general concern for the logging infrastructure, not specific to storage-engine.

### Recommendation

**Keep the current wrapping pattern.** It correctly preserves the original error in `details`.

Add one clarification: providers should NOT log errors themselves (Rule XXIII compliance). The responsibility chain is:

1. **Provider**: Wraps in `AppError` with hierarchical code + original error as `details`. Does not log.
2. **StorageService**: Propagates the `AppError` to the caller. May log _if_ it needs to take compensating action (e.g., rollback logging — see Concern 3).
3. **Caller** (API/bot layer): Logs the error via `@tempot/logger`, setting `loggedAt` to prevent double-logging.

### Affected Tasks/Files

- **Task 3, 4, 5** (all providers): No change — current pattern is correct. Add brief JSDoc comment: "Original error preserved in AppError.details for diagnostic use."
- **Task 9** (`storage.service.ts`): Add logger usage for rollback failures (see Concern 3) — this is the correct place for storage-engine to log.

---

## Design Concern 3: Two-Phase Rollback — Event Emission on Failure

### Context

In `StorageService.upload()`, if the provider upload succeeds (Phase 1) but the DB insert fails (Phase 2), the service attempts to delete the uploaded file:

```typescript
if (createResult.isErr()) {
  await this.provider.delete(providerKey);
  return err(createResult.error);
}
```

The current plan does not check the result of `this.provider.delete()` and does not emit any events for rollback or orphan creation.

### Analysis

**Should we emit an event for successful rollback?**

No. A successful rollback means the system corrected itself — there is no state change that external observers need to react to. The file never had a DB record, so it never "existed" from the system's perspective. Emitting an event would create noise for event subscribers.

**Should we emit an event if rollback fails (orphaned file)?**

Yes — but via logging, not events. Here is the reasoning:

1. **Events are for state changes that other modules react to.** An orphaned file is an internal consistency problem, not a domain event. No other module needs to react to "a file exists in S3 without a DB record."

2. **The purge/orphan cleanup job is the correct remediation.** The spec already defines a `storage.orphan.cleanup` job (edge cases section). The orphan cleanup job scans the provider for files without matching DB records.

3. **Logging is the correct observability mechanism.** A `WARN`-level structured log with the orphaned `providerKey`, provider type, and the original DB error gives operators the information they need. This log should go through `@tempot/logger` (not `console.*`, Rule LXXIV).

**Should we check the rollback result?**

Yes, we must. The current plan uses `await this.provider.delete(providerKey)` without checking the result. If the delete call returns `err()`, we silently swallow it — violating Rule X ("No Silent Failures"). We should check the result and log on failure.

### Recommendation

**Check rollback result. Log on failure. Do not emit events for rollback.**

Updated rollback logic:

```typescript
if (createResult.isErr()) {
  const rollbackResult = await this.provider.delete(providerKey);
  if (rollbackResult.isErr()) {
    this.logger.warn({
      code: STORAGE_ERRORS.ROLLBACK_FAILED,
      providerKey,
      provider: this.provider.type,
      originalError: createResult.error.code,
      rollbackError: rollbackResult.error.code,
    });
  }
  return err(createResult.error);
}
```

This requires adding a `Logger` dependency to `StorageService`.

### Affected Tasks/Files

- **Task 9** (`storage.service.ts`):
  - Add `Logger` to constructor dependencies (from `@tempot/logger`).
  - Check rollback result and log on failure with `STORAGE_ERRORS.ROLLBACK_FAILED`.
  - The returned error is still the original DB error (not the rollback error) — the caller does not need to know about rollback mechanics.
- **Task 1** (`errors.ts`): `STORAGE_ERRORS.ROLLBACK_FAILED` already exists — no change needed.
- **Task 11** (`purge.job.ts`): Already handles orphan-adjacent logic (expired records). The separate orphan cleanup job mentioned in the spec is deferred — no change.

---

## Design Concern 4: Purge Job — Hard Delete Implementation

### Context

`BaseRepository.delete()` performs a soft delete via Prisma's `$extends()` mechanism — it intercepts `delete()` and converts it to an `update({ isDeleted: true, deletedAt: new Date() })`. The purge job needs to PERMANENTLY remove records from the database after the retention period. `BaseRepository` does not expose a `hardDelete()` method.

### Analysis

**Option A: Add `hardDelete()` to `AttachmentRepository` (bypassing BaseRepository)**

```typescript
async hardDelete(id: string): AsyncResult<void, AppError> {
  // Use raw Prisma client, bypassing $extends soft-delete interception
}
```

Pros: Contained to one repository, explicit intent.
Cons: Requires access to the raw Prisma client (before `$extends()`), which the current architecture does not expose. The `db` property on `BaseRepository` is the _extended_ client — calling `this.db.attachment.delete()` would trigger the soft-delete extension again.

**Option B: Use Prisma client directly for permanent deletion**

```typescript
// In purge.job.ts
await prismaRaw.attachment.deleteMany({ where: { id: { in: expiredIds } } });
```

Pros: Simple, uses Prisma's actual delete.
Cons: Violates Rule XIV ("All database access via BaseRepository only. No direct Prisma calls in services or handlers"). The purge job is a handler/service-level concern.

**Option C: Add a `purge()` method to `BaseRepository`**

```typescript
// In BaseRepository
async purge(id: string): AsyncResult<void, AppError> {
  // Bypass the $extends soft-delete by using $executeRaw or a non-intercepted path
}
```

Pros: Available to all repositories, explicit intent.
Cons: Modifies shared code (Rule LIV — blast radius analysis required). Most entities should never be hard-deleted. Adding `purge()` to `BaseRepository` makes it available to every repository in the system, which is a footgun.

**Option D: Use `$executeRaw` in `AttachmentRepository`**

```typescript
async hardDelete(id: string): AsyncResult<void, AppError> {
  try {
    await this.db.$executeRaw`DELETE FROM "Attachment" WHERE id = ${id}`;
    return ok(undefined);
  } catch (e) {
    return err(new AppError('storage.hard_delete_failed', e));
  }
}
```

Pros: Bypasses the `$extends()` interception cleanly. Stays within the repository. Does not modify BaseRepository.
Cons: Raw SQL — harder to maintain if table name changes. `$executeRaw` is available on the extended client. Needs audit logging for permanent deletion.

**Option E: Use `$executeRaw` with `Prisma.sql` template for type safety**

Same as D but with Prisma's tagged template literal for parameterized queries. This is the safest raw SQL approach.

### Recommendation

**Option D/E: Add `hardDelete()` to `AttachmentRepository` using `$executeRaw`.** This is the best balance:

1. It does not modify `BaseRepository` (no blast radius — Rule LIV satisfied).
2. It stays within the repository layer (Rule XIV satisfied — database access is still through a repository method).
3. It bypasses the `$extends()` soft-delete interception, which is the root issue.
4. It is explicit about intent — `hardDelete` in the name signals permanence.
5. It should include audit logging for the permanent deletion action.

The method should also accept an array of IDs for batch deletion (the purge job processes multiple records):

```typescript
async hardDelete(ids: string[]): AsyncResult<void, AppError> {
  const { userId, userRole } = this.getContext();
  try {
    await this.db.$executeRaw`DELETE FROM "Attachment" WHERE id = ANY(${ids})`;

    await this.auditLogger.log({
      userId,
      userRole,
      action: 'storage.attachment.hard_delete',
      module: this.moduleName,
      targetId: ids.join(','),
      status: 'SUCCESS',
    });

    return ok(undefined);
  } catch (e) {
    return err(new AppError('storage.hard_delete_failed', e));
  }
}
```

Note: `$executeRaw` is available on both the base `PrismaClient` and the extended client — the extension only intercepts model-level `delete()`, not raw queries.

### Affected Tasks/Files

- **Task 8** (`attachment.repository.ts`): Add `hardDelete(ids: string[])` method using `$executeRaw`.
- **Task 1** (`errors.ts`): Add `HARD_DELETE_FAILED: 'storage.hard_delete_failed'` to `STORAGE_ERRORS`.
- **Task 11** (`purge.job.ts`): Call `attachmentRepo.hardDelete(expiredIds)` after provider file deletion.
- **No changes to `BaseRepository`** — this is repository-specific, not a shared concern.

---

## Design Concern 5: EventBusOrchestrator.publish() — Fire and Forget?

### Context

`StorageService.upload()` calls:

```typescript
await this.eventBus.publish('storage.file.uploaded', uploadedPayload);
```

`EventBusOrchestrator.publish()` returns `AsyncResult<void>`. The current plan does not check this result. If Redis is down, the orchestrator falls back to `LocalEventBus` (which only fails on invalid event names). The question: should event emission failure cause the upload to fail?

### Analysis

**What can go wrong with `publish()`?**

Looking at the actual implementation:

1. **Invalid event name**: Returns `err(AppError('event_bus.invalid_name'))`. This should never happen for storage events — they are hardcoded strings. If it does, it is a bug.

2. **Redis publish failure (Redis mode)**: Returns `err(AppError('event_bus.publish_failed'))`. However, the `ConnectionWatcher` detects Redis unavailability and the orchestrator falls back to `LocalEventBus`, which cannot fail (it uses `EventEmitter.emit()`). So this path is only hit if Redis goes down between the availability check and the publish call (a very narrow race window).

3. **Local bus failure**: The `LocalEventBus.publish()` only fails on invalid event names. Handler errors are caught and logged internally (not propagated to the publisher).

**Should upload fail if event emission fails?**

No. The upload has already succeeded at both the provider and DB layers. The file exists, the record exists, the system is in a consistent state. Failing the upload because of an event emission problem would:

1. **Leave the system in an inconsistent state**: The file and record exist, but the caller thinks the upload failed. They might retry, creating duplicates.
2. **Violate the principle of eventual consistency**: Events are notifications, not part of the transaction. Subscribers should tolerate missed events and catch up via polling or retry.
3. **Make the system fragile**: Every subscriber's availability would become a prerequisite for uploads.

**But should we completely ignore the result?**

No — Rule X ("No Silent Failures") applies. If event emission fails, we should log it as a warning. The upload is still successful, but operators need to know that downstream subscribers may not have been notified.

### Recommendation

**Check the result. Log on failure. Return success.**

```typescript
const publishResult = await this.eventBus.publish('storage.file.uploaded', uploadedPayload);
if (publishResult.isErr()) {
  this.logger.warn({
    code: 'storage.event.publish_failed',
    event: 'storage.file.uploaded',
    attachmentId: attachment.id,
    error: publishResult.error.code,
  });
}

return ok(attachment);
```

The same pattern applies to `storage.file.deleted` in the `delete()` method.

This is "fire-and-log" rather than "fire-and-forget" — we acknowledge failures without failing the primary operation.

### Affected Tasks/Files

- **Task 9** (`storage.service.ts`): Check `publish()` result in both `upload()` and `delete()`. Log on failure. Still return `ok(attachment)` / `ok(undefined)`.
- **Task 1** (`errors.ts`): Consider adding `EVENT_PUBLISH_FAILED: 'storage.event.publish_failed'` to `STORAGE_ERRORS` for consistency, though this is a warning-level code, not a returned error.
- Reinforces the need for a `Logger` dependency in `StorageService` (also needed for Concern 3).

---

## Design Concern 6: DriveProvider.getSignedUrl() — Semantic Mismatch

### Context

The `StorageProvider` interface defines `getSignedUrl(key, expiresInSeconds)`. For S3, this returns a genuine pre-signed URL — anyone with the URL can access the file for the specified duration without authentication. For LocalProvider, it returns a filesystem path (no auth concept). For DriveProvider, the plan returns `webViewLink`, which:

1. Requires the viewer to be authenticated with Google.
2. Requires the file to be shared with the viewer (or shared publicly).
3. Does not expire (unless sharing permissions are revoked).
4. The `expiresInSeconds` parameter is silently ignored.

### Analysis

**Is `webViewLink` semantically equivalent to a "signed URL"?**

No. The core semantic of a signed URL is: "anyone with this URL can access the file for a limited time without additional authentication." `webViewLink` satisfies none of these properties — it requires Google auth, requires sharing permissions, and does not expire.

**Should `getSignedUrl()` return an error for Drive?**

This would break the abstraction. The entire point of the `StorageProvider` interface (Rule XVIII, D1) is that consumers can switch providers without code changes (NFR-004). If `getSignedUrl()` returns an error for Drive, every caller needs Drive-specific error handling, defeating the purpose.

**Should we make Drive files publicly shareable?**

This would require calling `driveClient.permissions.create()` with `{ type: 'anyone', role: 'reader' }`. This makes the file accessible to anyone with the link — which is closer to the signed URL semantic. However:

1. The permission doesn't expire automatically (no time-limited access).
2. Making files publicly accessible is a significant security decision that should not be hidden inside a provider method.
3. The spec does not mention public sharing — it says "shareable links" for Drive (FR-006).

**What does the spec actually say?**

FR-006: "System MUST support secure download links via `getSignedUrl()`. S3 returns pre-signed URLs. Google Drive returns shareable links. LocalProvider returns the local file path."

The spec explicitly acknowledges that Drive returns "shareable links" — not "signed URLs." The method name `getSignedUrl` is an S3-centric name, but the spec defines it as a polymorphic operation whose behavior varies by provider.

### Recommendation

**Keep `getSignedUrl()` returning `webViewLink` for Drive, but document the semantic differences explicitly.**

1. **Add a `@remarks` JSDoc on the `StorageProvider.getSignedUrl()` interface method** explaining that behavior varies by provider: S3 returns a time-limited pre-signed URL; Drive returns a `webViewLink` requiring Google authentication (the `expiresInSeconds` parameter is not applicable); Local returns a filesystem path.

2. **Add a `@remarks` JSDoc on `DriveProvider.getSignedUrl()`** explicitly stating that `expiresInSeconds` is ignored and the returned link requires Google authentication and appropriate sharing permissions.

3. **Prefix the `_expiresInSeconds` parameter** (already done in the plan with underscore prefix) to signal it is unused.

4. **Do NOT change the return type or add provider-specific error handling.** The spec explicitly defines this polymorphic behavior, and the abstraction is more valuable than strict semantic purity.

An alternative to consider for the future: rename the interface method to `getAccessUrl()` or `getDownloadUrl()`, which is provider-neutral. However, this is a naming change that should go through an ADR if deemed important, and is not blocking for implementation.

### Affected Tasks/Files

- **Task 1** (`contracts.ts`): Add `@remarks` JSDoc on `StorageProvider.getSignedUrl()` documenting provider-specific behavior.
- **Task 5** (`drive.provider.ts`): Add `@remarks` JSDoc on `DriveProvider.getSignedUrl()` documenting that `expiresInSeconds` is ignored and the link requires Google auth.
- No structural changes. No error-path changes.

---

## Cross-Cutting Findings

### Finding A: StorageService needs a Logger dependency

Concerns 2, 3, and 5 all require `StorageService` to log warnings for non-fatal failures (rollback failures, event emission failures). The current plan does not include a `Logger` in `StorageService`'s constructor.

**Action**: Add a logger parameter to `StorageService`'s constructor. The `@tempot/logger` package provides the structured logging interface. This affects Task 9 and its test mocking setup.

Updated constructor signature:

```typescript
constructor(
  private readonly provider: StorageProvider,
  private readonly attachmentRepo: AttachmentRepository,
  private readonly validation: ValidationService,
  private readonly eventBus: EventBusOrchestrator,
  private readonly logger: Logger,
  private readonly config: StorageConfig,
)
```

Note: Constitution Rule II limits functions to 3 parameters. The constructor has 6 dependencies. This is acceptable for a constructor with dependency injection (constructors are not business logic functions), but if the linter enforces the rule on constructors, consider grouping dependencies into a `StorageServiceDeps` interface:

```typescript
interface StorageServiceDeps {
  provider: StorageProvider;
  attachmentRepo: AttachmentRepository;
  validation: ValidationService;
  eventBus: EventBusOrchestrator;
  logger: Logger;
  config: StorageConfig;
}
```

### Finding B: STORAGE_ERRORS needs two additions

- `HARD_DELETE_FAILED: 'storage.hard_delete_failed'` (Concern 4)
- `EVENT_PUBLISH_FAILED: 'storage.event.publish_failed'` (Concern 5, for logging only)

### Finding C: AttachmentRepository needs `hardDelete()`

Concern 4 concludes that `$executeRaw` within `AttachmentRepository` is the correct approach. This adds a method to Task 8's acceptance criteria.

---

## Summary of Recommendations

| #   | Concern                  | Recommendation                                               | Structural Change?                       |
| --- | ------------------------ | ------------------------------------------------------------ | ---------------------------------------- |
| 1   | Sync vs Async validation | Keep the split. Add JSDoc comments.                          | No                                       |
| 2   | Provider error wrapping  | Keep current pattern. Providers do not log.                  | No                                       |
| 3   | Rollback event emission  | Check rollback result. Log on failure. No events.            | Yes — add Logger to StorageService       |
| 4   | Hard delete for purge    | Add `hardDelete()` to AttachmentRepository via `$executeRaw` | Yes — new method on AttachmentRepository |
| 5   | Event publish result     | Check result. Log on failure. Upload still succeeds.         | Yes — check publish result, add Logger   |
| 6   | Drive getSignedUrl       | Keep returning webViewLink. Document limitations via JSDoc.  | No                                       |
