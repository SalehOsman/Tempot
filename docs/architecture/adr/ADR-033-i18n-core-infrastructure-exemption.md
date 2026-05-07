# ADR-033: i18n-core Infrastructure Exemption from Rule XVI

**Status:** Accepted
**Date:** 2026-04-01

## Context

Rule XVI (Pluggable Architecture) states every package can be enabled/disabled via `TEMPOT_{NAME}=true/false`. Rule XXXIX (i18n-Only) mandates all user-facing text goes through i18n keys. When `TEMPOT_I18N_CORE=false`, the `t()` function returns raw translation keys (e.g., `common.greeting`) instead of translated text, rendering the entire application unintelligible to users.

Three packages are already exempt from Rule XVI as core infrastructure: `@tempot/shared`, `@tempot/database`, and `@tempot/logger`. These packages are foundational — the system cannot function without them.

ADR-032 already carved out a special exception for `t()` (it returns `string` instead of `Result<T, AppError>`, exempting it from Rule XXI), establishing precedent that i18n-core has infrastructure-level characteristics.

## Decision

Classify `@tempot/i18n-core` as non-disablable core infrastructure, exempt from Rule XVI toggle requirements.

1. Remove the toggle guard from the `t()` function in `i18n.translator.ts`
2. Remove the toggle guard from `loadModuleLocales()` and `validateLocaleFile()` — these are part of the i18n initialization pipeline
3. Delete `i18n.toggle.ts` and its test
4. Remove the toggle export from `i18n-core/src/index.ts`
5. The `TEMPOT_I18N_CORE` environment variable is no longer recognized

Core infrastructure packages (now 4): `@tempot/shared`, `@tempot/database`, `@tempot/logger`, `@tempot/i18n-core`.

## Rationale

1. i18n-core is infrastructure, not a feature. Every user-facing string in every package depends on `t()`. Disabling it breaks all UI across the entire application.
2. Rule XVI's own wording requires the system to "function correctly" with any optional module disabled. A system showing raw keys like `common.errors.not_found` does not function correctly.
3. Rule XVI's intent targets optional features (search-engine, ai-core, document-engine) that can be individually disabled without affecting core functionality.
4. Precedent: ADR-032 already recognized i18n-core's special infrastructure status by exempting `t()` from Rule XXI.

## Consequences

- `@tempot/i18n-core` is always enabled; no environment variable can disable it
- Rule XVI's scope is refined: it applies to optional feature packages, not core infrastructure
- Constitution Rule XVI should be amended to explicitly list core infrastructure exemptions
- Other packages continue to use toggle guards normally

## Alternatives Rejected

1. **Keep toggle but return fallback text**: Requires maintaining a parallel set of hardcoded strings, violating Rule XXXIX
2. **Keep toggle but emit startup error**: Preserves Rule XVI's letter but adds dead code — no one would set the flag knowing it crashes the app
3. **Make t() return Result<string, AppError>**: Rejected in ADR-032 — too much ceremony for the most-called function in the codebase
