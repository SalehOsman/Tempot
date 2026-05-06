# CMS Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational `@tempot/cms-engine` package for deterministic dynamic translation overrides with AI-assisted draft review ports.

**Architecture:** `cms-engine` is a service package that sits beside `i18n-core`. Runtime lookup is deterministic and uses injected cache, override-store, and static-catalog ports. AI is only reachable through an optional review port used by explicit draft-review APIs and is never called by runtime translation lookup.

**Tech Stack:** TypeScript 5.9.3 strict mode, neverthrow 8.2.0, `@tempot/shared`, optional adapter ports for cache/store/event/audit/AI, and `sanitize-html` for value sanitization.

---

## Constitution Check

- TypeScript strict mode is mandatory.
- Public fallible APIs return `AsyncResult<T, AppError>` or `Result<T, AppError>`.
- No direct Prisma, Redis, dashboard, Telegram, or AI provider calls in the package core.
- No hardcoded user-facing text; exported message keys are i18n keys.
- Package checklist artifacts must exist before production source files.
- Runtime lookup must not call AI because SC-001 requires cached lookup below 2ms.

## Package Boundary

`@tempot/cms-engine` owns:

- Translation override contracts.
- Fallback resolution orchestration.
- Protected key and placeholder validation.
- Sanitization policy.
- Cache invalidation event payloads.
- Audit payload construction.
- Optional AI draft review contracts and service method.

`@tempot/cms-engine` does not own:

- Dashboard UI.
- Prisma repositories or migrations in this MVP.
- Redis clients.
- Direct `ai-core` provider calls.
- Translation key creation or deletion.

## Runtime Flow

1. If `TEMPOT_DYNAMIC_CMS !== "true"`, resolve from static catalog only.
2. If enabled, read `cms:{locale}:{namespace}:{key}` from cache.
3. If cache misses, read an override from the injected store.
4. If an override exists, write it into cache and return it.
5. If no override exists, read static value for requested locale, then fallback locale.
6. If no static value exists, return a typed missing-key error.

## Mutation Flow

1. Require `TEMPOT_DYNAMIC_CMS=true`.
2. Confirm the static key exists.
3. Evaluate protected policy.
4. Sanitize the proposed value.
5. Validate placeholder preservation against the source static value.
6. Persist override through the injected store.
7. Delete the cache key.
8. Publish `cms.translation.updated`.
9. Write audit payload.
10. Return the persisted override snapshot.

## AI Review Flow

1. Require explicit `reviewDraftWithAi()` call.
2. Return typed error if no `CmsAiReviewerPort` is configured.
3. Run deterministic placeholder/protection checks locally.
4. Call injected AI reviewer with draft context.
5. Return report as draft-only metadata.
6. Never publish AI suggestions automatically.

## Documentation Sync

- Update Spec #008 artifacts: `spec.md`, `plan.md`, `research.md`, `data-model.md`, and `tasks.md`.
- Update `docs/archive/ROADMAP.md` from deferred status to active/completed when merged.
- Update `packages/cms-engine/README.md`.
- Add a changeset for `@tempot/cms-engine`.
- Run `pnpm spec:validate` after artifact repair and implementation.
