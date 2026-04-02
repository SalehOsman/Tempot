# Feature Specification: i18n Core (The i18n-Only Rule)

**Feature Branch**: `007-i18n-core-package`  
**Created**: 2026-03-19  
**Status**: Complete  
**Input**: User description: "Establish the foundational i18n-core package providing multi-language support and enforcing the i18n-Only Rule as per Architecture Spec v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Multi-language User Interface (Priority: P1)

As a user, I want to see the bot in my chosen language so that I can understand and interact with it easily and comfortably.

**Why this priority**: Core accessibility and global reach requirement for a professional bot experience.

**Independent Test**: Verified by changing the user's language setting in the session and confirming that all messages and buttons are translated correctly.

**Acceptance Scenarios**:

1. **Given** a user with language set to `ar` (Arabic), **When** the bot sends any message or menu, **Then** all content is displayed in Arabic with correct RTL alignment.
2. **Given** a user with language set to `en` (English), **When** the bot sends any message or menu, **Then** all content is displayed in English.

---

### User Story 2 - Zero-Hardcoding Enforcement (Priority: P1)

As a developer, I want the system to prevent me from hardcoding any text directly in the source code so that the application remains fully translatable and maintainable.

**Why this priority**: Required by the Project Constitution (Rule XXXIX) to maintain a professional, localized codebase.

**Independent Test**: Attempting to commit code containing hardcoded human-readable strings and verifying that the `pnpm cms:check` task fails and provides clear feedback.

**Acceptance Scenarios**:

1. **Given** a source file containing a hardcoded Arabic or English string (outside of locale files), **When** the build or `cms:check` is run, **Then** the check fails and alerts the developer.
2. **Given** a new i18n key in a module's locale file, **When** it is used via the `t()` function, **Then** it is correctly rendered in all supported languages with all variables properly interpolated.

---

## Edge Cases

- **Missing Translation Key**: What happens if a translation key is missing in a specific language? (Answer: Fallback to the `DEFAULT_LANGUAGE`. If missing in all, return the key name itself).
- **Dynamic Variables**: Handling complex pluralization and gender-specific translations (Answer: Full support for `i18next` features like interpolation and pluralization).
- **RTL Support**: Ensuring layouts (especially in the Mini App and Dashboard) adapt correctly for Arabic (Answer: Mandatory RTL check for all UI components).

## Clarifications

- **Technical Constraints**: `i18next` engine. `ar` (Arabic) is the primary language.
- **Constitution Rules**: Rule XXXIX (i18n-Only Rule) and Rule XL (Language Rule: English for devs, i18n for users). `pnpm cms:check` is mandatory in CI/CD.
- **Integration Points**: Used by all UI components (`input-engine`, `ux-helpers`, `notifier`).
- **Edge Cases**: Missing keys fall back to `DEFAULT_LANGUAGE` with a warning. RTL support is mandatory for all Arabic layouts. Dynamic variables are sanitized via `sanitize-html`.

### Session 2026-03-24

- Q: Which language should be the hardcoded fallback if the .env value is missing or invalid? → A: Arabic (ar). Env vars: `TEMPOT_DEFAULT_LANGUAGE` (primary language, default `ar`), `TEMPOT_FALLBACK_LANGUAGE` (fallback language, default `en`).
- Q: When a translation key is missing in both the user's language and the fallback language, what should the system return? → A: The translation key name (e.g., modules.auth.welcome)
- Q: Should the i18n-core package provide utility functions or metadata (e.g., a getLocaleInfo() function) to indicate the current language's direction (RTL/LTR)? → A: Yes, provide locale metadata helpers
- Q: What level of detection is required for the cms:check script to detect hardcoded strings? → A: AST-based analysis (e.g., ESLint/specialized tool)
- Q: Should the i18n-core package enforce a specific schema for the JSON locale files (e.g., using Zod) during the cms:check process? → A: Yes, enforce JSON schema validation
- Q: Do language priorities (Arabic primary, English secondary) differ between Bot Messages and Mini Apps? → A: No, priorities are uniform across all interfaces.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use `i18next` as the primary translation engine for all components.
- **FR-002**: System MUST strictly enforce the "i18n-Only Rule" (Rule XXXIX) for all source code.
- **FR-003**: System MUST support `ar` (Arabic) as the primary and `en` (English) as the secondary default languages.
- **FR-004**: System MUST organize translation files by module in `modules/{module}/locales/{lang}.json` (path relative to workspace root).
- **FR-005**: System MUST provide a unified `t(key, options)` function that automatically detects the user's language from the current session context.
  - _Note: `t()` intentionally returns `string` (not `Result<string, AppError>`) because i18next's `t()` never throws — missing keys return the key name itself. This is an explicit exemption from Rule XXI, justified by the infallible nature of the underlying operation._
- **FR-006**: System MUST implement an automatic fallback mechanism to the `DEFAULT_LANGUAGE` defined in `.env` via the `TEMPOT_DEFAULT_LANGUAGE` environment variable (default: `'ar'`). The fallback language is configured via `TEMPOT_FALLBACK_LANGUAGE` (default: `'en'`). If env vars are missing, system MUST fallback to Arabic (`ar`) primary and English (`en`) fallback.
- **FR-007**: System MUST provide a script (`pnpm cms:check`) that uses AST-based analysis and JSON schema validation (via Zod) to verify translation completeness, detect hardcoded strings, and ensure locale file integrity.
- **FR-008**: System MUST provide a `getLocaleInfo()` helper returning the current language and its directionality (RTL/LTR).
- **FR-009**: System MUST support a `TEMPOT_I18N_CORE` environment variable (`true`/`false`, default `true`) to enable/disable the i18n-core package per Constitution Rule XVI (Pluggable Architecture). When disabled, `t(key)` returns the key name unchanged, and `loadModuleLocales()` is a no-op returning `ok(undefined)`.

### Key Entities

- **TranslationKey**: A hierarchical string (e.g., `common.errors.not_found`) used to reference a translated string.
- **LocaleFile**: A JSON file per language per module containing key-value pairs for translations.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% absence of hardcoded human-readable strings in the source code outside of designated locale files.
- **SC-002**: Translation key retrieval and rendering overhead must be < 1ms per message.
- **SC-003**: 100% of modules must have complete and valid `ar.json` and `en.json` files from the first day of creation.
- **SC-004**: The system successfully passes all `cms:check` validations in the CI/CD pipeline.
