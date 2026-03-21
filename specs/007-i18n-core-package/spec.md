# Feature Specification: i18n Core (The i18n-Only Rule)

**Feature Branch**: `007-i18n-core-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the foundational i18n-core package providing multi-language support and enforcing the i18n-Only Rule as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

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

- **Missing Translation Key**: What happens if a translation key is missing in a specific language? (Answer: Fallback to the `DEFAULT_LANGUAGE` and log a warning).
- **Dynamic Variables**: Handling complex pluralization and gender-specific translations (Answer: Full support for `i18next` features like interpolation and pluralization).
- **RTL Support**: Ensuring layouts (especially in the Mini App and Dashboard) adapt correctly for Arabic (Answer: Mandatory RTL check for all UI components).

## Clarifications

- **Technical Constraints**: `i18next` engine. `ar` (Arabic) is the primary language.
- **Constitution Rules**: Rule XXXIX (i18n-Only Rule) and Rule XL (Language Rule: English for devs, i18n for users). `pnpm cms:check` is mandatory in CI/CD.
- **Integration Points**: Used by all UI components (`input-engine`, `ux-helpers`, `notifier`).
- **Edge Cases**: Missing keys fall back to `DEFAULT_LANGUAGE` with a warning. RTL support is mandatory for all Arabic layouts. Dynamic variables are sanitized via `sanitize-html`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `i18next` as the primary translation engine for all components.
- **FR-002**: System MUST strictly enforce the "i18n-Only Rule" (Rule XXXIX) for all source code.
- **FR-003**: System MUST support `ar` (Arabic) as the primary and `en` (English) as the secondary default languages.
- **FR-004**: System MUST organize translation files by module in `/modules/{module}/locales/{lang}.json`.
- **FR-005**: System MUST provide a unified `t(key, options)` function that automatically detects the user's language from the current session context.
- **FR-006**: System MUST implement an automatic fallback mechanism to the `DEFAULT_LANGUAGE` defined in `.env`.
- **FR-007**: System MUST provide a script (`pnpm cms:check`) to verify translation completeness and detect hardcoded strings.

### Key Entities

- **TranslationKey**: A hierarchical string (e.g., `common.errors.not_found`) used to reference a translated string.
- **LocaleFile**: A JSON file per language per module containing key-value pairs for translations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% absence of hardcoded human-readable strings in the source code outside of designated locale files.
- **SC-002**: Translation key retrieval and rendering overhead must be < 1ms per message.
- **SC-003**: 100% of modules must have complete and valid `ar.json` and `en.json` files from the first day of creation.
- **SC-004**: The system successfully passes all `cms:check` validations in the CI/CD pipeline.
