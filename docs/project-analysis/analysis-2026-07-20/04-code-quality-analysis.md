# 04 - Code Quality Analysis

This document provides a code quality audit of the Tempot repository, evaluating coding standards, duplicates, complexity, i18n, and compliance with the project's strict constitution.

---

## 1. Code Quality Overview

Tempot enforces rigid code quality gates. The project relies on TypeScript strict mode, ESLint, and custom scripts to ensure conformity.

### Key Constitutional Constraints (Rule I & II):
* **File Length Limit:** 200 lines per file (except generated schemas or configuration fixtures).
* **Function Length Limit:** 50 lines per function.
* **Parameter Count Limit:** Maximum 3 parameters per function.
* **No `any`, `@ts-ignore`, or `@ts-expect-error`** allowed.
* **No Hardcoded User-Facing Text:** All messages must use i18n keys.

---

## 2. Code Quality Audit Findings

### Code Quality Strengths:
1. **Purity of Production Source:** ESLint rules block the use of `console.log/warn/error` in production code (`src/` and `handlers/`). Pino structured logging is used exclusively.
2. **ESM-Strict Conformity:** All imports use proper file extensions, and the project runs fully under Node ESM.
3. **No Unused Code:** Dead code is actively cleaned or deleted instead of being commented out (complying with Rule XI).
4. **Strong i18n Discipline:** User-facing text is systematically loaded from translation JSONs (`locales/ar.json` and `locales/en.json`) using key strings.

---

## 3. Code Quality Issue Register

While the core codebase is clean, several operational scripts, tests, and configuration files carry technical debt:

| Issue | File | Severity | Impact | Proposed Solution |
| :--- | :--- | :---: | :--- | :--- |
| **Allowlist Exception Debt** | `scripts/ci/methodology-lint.allowlist.json` | High | Normalizes exceptions for Arabic comments and legacy documentation. | Plan and execute a systematic burn-down of the remaining 26 exceptions. |
| **Arabic comments in codebase** | `modules/user-management/abilities.ts` & others | Medium | Violates Rule XL (English-only developer text). | Translate all comments and code tokens into English. |
| **Loose code pattern in generator templates** | `scripts/tempot/module-generator.templates.ts` | Medium | Contains template strings with raw Arabic comments that require allowlist exceptions. | Translate generator templates to English and move Arabic references to i18n files. |
| **Astro Build pagefind warnings** | `apps/docs/` (build time) | Low | Noise in logs: `Pagefind Entry docs -> 404 was not found`. | Correct Pagefind routing configurations in `astro.config.mjs`. |

---

## 4. Code Quality Recommendations

1. **Rule I Linting Automation:** Add ESLint rules or custom parser hooks to block commits that violate the 200-line file limit or 50-line function limit.
2. **Burn-down Allowlist Debt:** Integrate allowlist expiration warnings into the `methodology:lint` output to ensure exceptions are reviewed before they expire (currently set to 2026-10-09).
3. **Strict Parameter Linting:** Enforce the 3-parameter function limit through automated lint rules to prevent large signature lists.
