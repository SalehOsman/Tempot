# 0006. Zero Hardcoded Natural Language Strings & Sovereign i18n Sentinel

Date: 2026-10-23  
Status: Accepted  
Incident Reference: `INC-20261023-HARDCODED-LOCALE-STRINGS`  
Enforcement Sentinel: `Taboo 11` (Zero Hardcoded Locales Invariant)  

---

## Context & Problem Statement
During architectural inspection and code review of `tembot-v2`, 136 lines of code were discovered containing hardcoded Arabic natural language string literals across domain services, Telegram bot controllers, components, and frontend applications (`modules/kernel/system-settings`, `apps/bot`, `apps/dashboard`, `apps/tma`, `@tembot/core-components`).

As an omnichannel, domain-agnostic starter kit supporting multi-tenancy and multiple languages (`ar`, `en`), hardcoding text directly into source files violates:
1. Separation of concerns between domain logic and presentation resources.
2. Clean localization and seamless switching between Arabic and English.
3. Anti-Premature Implementation covenants regarding maintainability and clean craftsmanship.

## Decision
1. **Constitutional Invariant (Taboo 11):** Formally forbid any hardcoded natural language strings in source files (`.ts`, `.tsx`) outside designated `locales/` directories.
2. **Type-Safe Locale Dictionaries:** Require each package, kernel module, and app surface to define mirrored, type-checked translation dictionaries (`locales/ar.ts`, `locales/en.ts`) ensuring 100% key parity at compile time.
3. **Mechanical Sentinel Gate:** Implement an automated scanner (`tooling/scripts/verify-no-hardcoded-strings.mjs`) and Vitest sentinel test integrated into `pnpm test` and `pnpm check:i18n` that fails the build if any non-locale source file contains hardcoded natural language literals.
4. **Agent Governance Rule:** Establish `.agents/rules/i18n-sentinel.md` instructing all AI agents never to write literal UI text directly into code files.

## Consequences

### Positive:
- True multi-lingual support: Adding or altering translations does not touch code logic or risk regressions.
- Compile-time safety: TypeScript guarantees that missing translation keys produce instant build errors.
- Automated gatekeeping: CI/CD mechanically blocks any regression or hardcoded text from entering the codebase.

### Negative / Trade-offs:
- Slightly increased initial development time to add keys to `locales/` instead of inline strings.
- Requires developers and agents to follow strict dictionary-first authoring.
