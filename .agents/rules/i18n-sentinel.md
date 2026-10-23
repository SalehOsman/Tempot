# Sovereign i18n & Zero Hardcoded Strings Rule

> **Constitutional Authority:** `Taboo 11` (Zero Hardcoded Locales Invariant), `INC-20261023-HARDCODED-LOCALE-STRINGS`, `ADR-0006`

## Rule Directives:
1. **Never write raw natural language strings (Arabic, English, or any other language) inside source code files (`.ts`, `.tsx`) outside designated `locales/` directories.**
2. When introducing user-facing text, button labels, titles, error descriptions, or UI messages:
   - First add the key and its Arabic translation to `src/locales/ar.ts`.
   - Add the matching English translation to `src/locales/en.ts`.
   - Reference the text exclusively via the translation dictionary or translation helper.
3. Every commit is validated by the mechanical gate `pnpm check:i18n`. Any hardcoded Arabic character range `[\u0600-\u06FF]` or unindexed UI string in non-locale files will fail the build immediately.
