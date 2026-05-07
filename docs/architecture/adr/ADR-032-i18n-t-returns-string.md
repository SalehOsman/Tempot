# ADR-032: i18n t() Returns string, Not Result<string, AppError>

**Status:** Accepted  
**Date:** 2026-03-31  
**Context:** Rule XXI mandates the Result pattern for all public APIs. The `t()` function is the most frequently called function in the codebase.

## Decision

`t()` returns `string` directly, not `Result<string, AppError>`.

## Rationale

1. **i18next never throws**: The underlying `i18next.t()` always returns a string — either the translation, the fallback, or the key name itself. There is no error path to model.
2. **Ergonomics**: `t()` is called hundreds of times across every module. Wrapping every call in `.match()` or `.unwrap()` would degrade readability with zero safety benefit.
3. **Key-as-fallback is safe**: When a translation key is missing, i18next returns the key name (e.g., `'common.greeting'`). This is visible in the UI and caught by `pnpm cms:check` — no silent failure.
4. **Rule XXI intent**: The Result pattern exists to prevent silent failures and unhandled errors. Since `t()` has no error path, wrapping it adds ceremony without safety.

## Consequences

- Missing translations surface as visible key names in the UI
- `pnpm cms:check` catches missing keys at CI time
- Consumers call `t('key')` directly without Result handling
