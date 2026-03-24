# Tasks: i18n Core (The i18n-Only Rule)

**Goal:** Establish the foundational i18n-core package providing multi-language support (Arabic primary) and enforcing the "i18n-Only Rule" (Rule XXXIX).

**Architecture:** A wrapper around `i18next` that integrates with `@tempot/session-manager` (via `AsyncLocalStorage`) to automatically detect user language from the current session. It uses a modular loading strategy to fetch translations from `/modules/{module}/locales/{lang}.json`. Public APIs follow the **Result pattern** (Rule XXI) using `neverthrow`.

**Tech Stack:** TypeScript, i18next, glob, zod, i18next-parser, neverthrow, sanitize-html.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Initialize package structure in `packages/i18n-core/` (package.json, tsconfig.json, vitest.config.ts)
- [ ] T002 Install core dependencies (`i18next`, `glob`, `zod`, `i18next-parser`, `neverthrow`, `sanitize-html`)
- [ ] T003 Create `packages/i18n-core/src/index.ts` to export public interfaces and helpers

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 [P] Implement `i18nConfig` in `packages/i18n-core/src/i18n.config.ts` with Arabic primary and English fallback (FR-003, FR-006)
- [ ] T005 [P] Implement `LocaleSchema` using Zod in `packages/i18n-core/src/schema.ts` for locale file validation
- [ ] T006 [P] Implement dynamic variable sanitization helper using `sanitize-html` in `packages/i18n-core/src/sanitizer.ts`

---

## Phase 3: User Story 1 - Multi-language User Interface (Priority: P1)

**Goal**: As a user, I want to see the bot in my chosen language so that I can understand and interact with it easily.

**Independent Test**: Storing 'en' in session context and verifying `t('common.test')` returns the English translation.

- [ ] T007 [P] [US1] Implement `loadModuleLocales` in `packages/i18n-core/src/loader.ts` using `glob` (returns `Result<void, AppError>`)
- [ ] T008 [US1] Implement context-aware `t(key, options)` in `packages/i18n-core/src/t.ts` using `@tempot/session-manager` (returns `string`)
- [ ] T009 [P] [US1] Implement `getLocaleInfo()` helper in `packages/i18n-core/src/helpers.ts` for RTL/LTR detection
- [ ] T010 [US1] Unit test for language fallback, sanitization, and missing key behavior in `packages/i18n-core/tests/unit/t-function.test.ts`

---

## Phase 4: User Story 2 - Zero-Hardcoding Enforcement (Priority: P1)

**Goal**: As a developer, I want the system to prevent me from hardcoding any text directly in the source code.

**Independent Test**: Running `pnpm cms:check` on a file with hardcoded human-readable strings and verifying it fails.

- [ ] T011 [US2] Configure `i18next-parser` for AST-based extraction in `packages/i18n-core/config/parser.config.js`
- [ ] T012 [US2] Implement `cms:check` script in `packages/i18n-core/scripts/cms-check.ts` using AST analysis and Zod validation
- [ ] T013 [US2] Add `cms:check` to root `package.json` scripts and husky pre-commit hooks
- [ ] T014 [US2] Unit test for hardcoded string detection in `packages/i18n-core/tests/unit/cms-check.test.ts`

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T015 Ensure all internal errors are mapped correctly using Result pattern (`neverthrow`)
- [ ] T016 Create `README.md` for the package with usage examples
- [ ] T017 Add standard JSDoc/TSDoc to public interfaces (`t`, `getLocaleInfo`, `loadModuleLocales`)

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
