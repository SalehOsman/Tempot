# Tasks: i18n Core (The i18n-Only Rule)

**Goal:** Establish the foundational i18n-core package providing multi-language support (Arabic primary) and enforcing the "i18n-Only Rule" (Rule XXXIX).

**Architecture:** A wrapper around `i18next` that integrates with `@tempot/session-manager` (via `AsyncLocalStorage`) to automatically detect user language from the current session. It uses a modular loading strategy to fetch translations from `/modules/{module}/locales/{lang}.json`. Public APIs follow the **Result pattern** (Rule XXI) using `neverthrow`.

**Tech Stack:** TypeScript, i18next, glob, zod, i18next-parser, neverthrow, sanitize-html.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Initialize package structure in `packages/i18n-core/` (package.json, tsconfig.json, vitest.config.ts)
- [ ] T002 Install core dependencies (`i18next`, `glob`, `zod`, `i18next-parser`, `neverthrow: "8.2.0"`, `sanitize-html`)
- [ ] T003 Create `packages/i18n-core/src/index.ts` to export public interfaces and helpers
- [ ] T001a Verify all 10 points of `docs/developer/package-creation-checklist.md` pass

> **Rule LXXI Note**: The Package Readiness Checklist must be completed before any code is written. This task was added retroactively to document compliance.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 [P] Implement `i18nConfig` in `packages/i18n-core/src/i18n.config.ts` with Arabic primary and English fallback (FR-001, FR-003, FR-006)
- [ ] T005 [P] Implement `LocaleSchema` using Zod in `packages/i18n-core/src/i18n.schema.ts` for locale file validation
- [ ] T006 [P] Implement dynamic variable sanitization helper using `sanitize-html` in `packages/i18n-core/src/i18n.sanitizer.ts`

---

## Phase 3: User Story 1 - Multi-language User Interface (Priority: P1)

**Goal**: As a user, I want to see the bot in my chosen language so that I can understand and interact with it easily.

**Independent Test**: Storing 'en' in session context and verifying `t('common.test')` returns the English translation.

- [ ] T007 [P] [US1] Implement `loadModuleLocales` in `packages/i18n-core/src/i18n.loader.ts` using `glob` (returns `Result<void, AppError>`) (FR-004)
- [ ] T008 [US1] Implement context-aware `t(key, options)` in `packages/i18n-core/src/i18n.translator.ts` using `@tempot/session-manager` (returns `string`) (FR-005)
- [ ] T009 [P] [US1] Implement `getLocaleInfo()` helper in `packages/i18n-core/src/i18n.locale-info.ts` for RTL/LTR detection (FR-008)
- [ ] T010 [US1] Unit test for language fallback, sanitization, and missing key behavior in `packages/i18n-core/tests/unit/i18n.translator.test.ts`
- [ ] T010a [US1] Performance benchmark: verify translation retrieval completes in < 1ms per call (SC-002) in `packages/i18n-core/tests/unit/i18n.performance.test.ts`

---

## Phase 4: User Story 2 - Zero-Hardcoding Enforcement (Priority: P1)

**Goal**: As a developer, I want the system to prevent me from hardcoding any text directly in the source code.

**Independent Test**: Running `pnpm cms:check` on a file with hardcoded human-readable strings and verifying it fails.

- [ ] T011 [US2] Configure `i18next-parser` for AST-based extraction in `packages/i18n-core/config/parser.config.js`

### T011 Acceptance Criteria

- [ ] Parser config targets all TypeScript source files across workspace packages
- [ ] Extracts `t()` call keys using AST (not regex)
- [ ] Output format compatible with i18next JSON structure

- [ ] T012 [US2] Implement `cms:check` script in `packages/i18n-core/scripts/cms-check.ts` using AST analysis and Zod validation (FR-002, FR-007, SC-001, SC-003, SC-004)

### T012 Acceptance Criteria

- [ ] Detects hardcoded Arabic/English strings in `.ts` files (excluding locale files, tests, and config)
- [ ] Validates all locale JSON files against Zod schema (LocaleSchema)
- [ ] Verifies key parity between `ar.json` and `en.json` for every module
- [ ] Exit code 0 on success, non-zero on failure
- [ ] Outputs clear error messages with file path and line number for each violation

- [ ] T013 [US2] Add `cms:check` to root `package.json` scripts and husky pre-commit hooks

### T013 Acceptance Criteria

- [ ] `pnpm cms:check` runs from monorepo root
- [ ] Pre-commit hook runs `cms:check` and blocks commit on failure
- [ ] CI pipeline includes `cms:check` step

- [ ] T014 [US2] Unit test for hardcoded string detection in `packages/i18n-core/tests/unit/cms-check.test.ts`

### T014 Acceptance Criteria

- [ ] Test verifies hardcoded Arabic string is flagged
- [ ] Test verifies hardcoded English string is flagged
- [ ] Test verifies `t()` calls are NOT flagged
- [ ] Test verifies locale files pass schema validation
- [ ] Test verifies key parity check catches missing keys

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T015 Ensure all internal errors are mapped correctly using Result pattern (`neverthrow`)
- [ ] T016 Create `README.md` for the package with usage examples
- [ ] T017 Add standard JSDoc/TSDoc to public interfaces (`t`, `getLocaleInfo`, `loadModuleLocales`)

---

## Phase 6: Pluggable Architecture Toggle (Rule XVI)

- [ ] T018 [P] Implement `TEMPOT_I18N_CORE` environment variable toggle in `packages/i18n-core/src/i18n.config.ts` (FR-009)

### Acceptance Criteria

- [ ] `TEMPOT_I18N_CORE=false` causes `t(key)` to return the key name unchanged
- [ ] `TEMPOT_I18N_CORE=false` causes `loadModuleLocales()` to return `ok(undefined)` without loading any files
- [ ] `TEMPOT_I18N_CORE=true` (default) preserves all existing behavior
- [ ] Unit test verifies disabled behavior

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (Multi-language UI).
3. **VALIDATE**: Run unit and integration tests for translation retrieval and sanitization.

### Incremental Delivery

1. Add Phase 4 (Zero-Hardcoding Enforcement).
2. **VALIDATE**: Ensure `cms:check` fails on hardcoded strings.
3. Polish and document.
