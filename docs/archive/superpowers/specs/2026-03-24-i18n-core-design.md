# Feature Specification: i18n Core (The i18n-Only Rule)
**Feature Branch**: `007-i18n-core-package`
**Created**: 2026-03-24
**Status**: Approved Design

## Overview
This design outlines the architecture for the `i18n-core` package in the Tempot framework. It establishes multi-language support (Arabic as primary) and enforces the "i18n-Only Rule" (Rule XXXIX) via automated checks.

## Architecture: Context-Injected Facade
The `i18n-core` package will act as a wrapper around `i18next`, leveraging `@tempot/session-manager` to provide an automatically contextualized `t()` translation function.

### Core Components
1. **Translation Engine Wrapper (`i18next` Configuration)**: Configured with `ar` as the primary language and `en` as the secondary fallback.
2. **Context-Aware `t()` Function**: Exports a globally available `t(key, options)` function. Internally, this function queries `sessionContext.getStore()?.lang` to determine the active language. If the session is missing or invalid, it falls back to the `.env` default (or `ar`).
3. **Modular Locale Loader**: A glob-based loader that scans `/modules/{module}/locales/{lang}.json` at startup and populates the `i18next` resources, ensuring translation separation by module.
4. **Validation Tooling (`cms:check`)**:
    - **AST-based Detection**: A custom ESLint rule built for Tempot that scans all `.ts` and `.tsx` files (outside of `locales/`) to detect any hardcoded human-readable strings, alerting the developer to use `t()`.
    - **Zod Schema Generation**: During validation, `ar.json` serves as the source of truth. The script generates Zod schemas based on the Arabic keys and dynamically validates all other locale files (e.g., `en.json`) against these schemas to ensure parity.

## Dependencies
- `i18next` for core translation logic.
- `@tempot/session-manager` for `AsyncLocalStorage`-based language context.
- `zod` for dynamic schema validation of locale structures.
- Custom ESLint plugin logic for AST-based hardcoded string detection.
- `neverthrow` for Result-based public APIs (Rule XXI).

## Error Handling & Edge Cases
- **Missing Translations**: `t()` falls back to `en.json`, then to the translation key string itself.
- **RTL Metadata**: `getLocaleInfo()` returns `lang` and `dir` (e.g., `'ar'`, `'rtl'`) to assist UI layout engines.
