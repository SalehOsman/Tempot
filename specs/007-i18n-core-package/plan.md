# i18n Core Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational i18n-core package providing multi-language support (Arabic primary) and enforcing the "i18n-Only Rule" (Rule XXXIX).

**Architecture:** A wrapper around `i18next` that integrates with `@tempot/session-manager` (via `AsyncLocalStorage`) to automatically detect user language from the current session. It uses a modular loading strategy to fetch translations from `/modules/{module}/locales/{lang}.json`. Public APIs follow the **Result pattern** (Rule XXI) using `neverthrow`.

**Tech Stack:** TypeScript, i18next, @tempot/session-manager, glob, zod (for locale validation), neverthrow (for error handling), sanitize-html (for dynamic variable safety).

---

### Task 1: Translation Engine Configuration (FR-001, FR-003)

**Files:**

- Create: `packages/i18n-core/src/i18n.config.ts`
- Test: `packages/i18n-core/tests/unit/i18n-config.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { i18nConfig } from '../src/i18n.config';

describe('i18n Configuration', () => {
  it('should have Arabic as primary and English as secondary language', () => {
    expect(i18nConfig.lng).toBe('ar');
    expect(i18nConfig.fallbackLng).toBe('en');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/i18n-core/tests/unit/i18n-config.test.ts`
Expected: FAIL (i18nConfig not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export const i18nConfig = {
  lng: 'ar',
  fallbackLng: 'en',
  supportedLngs: ['ar', 'en'],
  interpolation: {
    escapeValue: false, // Not needed for bot messages
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/i18n-core/tests/unit/i18n-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/i18n-core/src/i18n.config.ts packages/i18n-core/tests/unit/i18n-config.test.ts
git commit -m "feat(i18n): configure i18next with Arabic as primary language (FR-003)"
```

---

### Task 2: Modular Locale Loader (FR-004, FR-006)

**Files:**

- Create: `packages/i18n-core/src/i18n.loader.ts`
- Test: `packages/i18n-core/tests/unit/loader.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { loadModuleLocales } from '../src/loader';

describe('Modular Locale Loader', () => {
  it('should load JSON files from module directories', async () => {
    // Requires a mock filesystem or temporary files
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/i18n-core/tests/unit/loader.test.ts`
Expected: FAIL (loadModuleLocales not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';

export async function loadModuleLocales(i18n: i18next.i18n): AsyncResult<void, AppError> {
  try {
    const localeFiles = await glob('modules/*/locales/*.json');
    for (const file of localeFiles) {
      const [_, moduleName, __, langFile] = file.split(path.sep);
      const lang = path.basename(langFile, '.json');
      const raw = await fs.readFile(file, 'utf-8');
      const content = JSON.parse(raw) as Record<string, unknown>;
      i18n.addResourceBundle(lang, moduleName, content, true, true);
    }
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError('i18n.locale_load_failed', error));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/i18n-core/tests/unit/loader.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/i18n-core/src/i18n.loader.ts packages/i18n-core/tests/unit/loader.test.ts
git commit -m "feat(i18n): implement modular locale loader (FR-004)"
```

---

### Task 3: Context-Aware t() Function (FR-005)

**Files:**

- Create: `packages/i18n-core/src/i18n.translator.ts`
- Test: `packages/i18n-core/tests/unit/i18n.translator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { t } from '../src/t';
import { sessionContext } from '@tempot/session-manager';

describe('Context-Aware t()', () => {
  it('should use language from session context', async () => {
    // Mock AsyncLocalStorage.run
    sessionContext.run({ lang: 'en' }, () => {
      expect(t('common.welcome')).toBe('Welcome'); // Mocked i18next
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/i18n-core/tests/unit/i18n.translator.test.ts`
Expected: FAIL (t() not defined or sessionContext ignored)

- [ ] **Step 3: Write minimal implementation**

```typescript
import i18next from 'i18next';
import { sessionContext } from '@tempot/session-manager';

export function t(key: string, options?: Record<string, unknown>): string {
  const context = sessionContext.getStore();
  const lang = context?.lang || 'ar';
  return i18next.t(key, { ...options, lng: lang });
}
// Note: t() returns string by design — it never fails (missing keys return key name). This is intentional per spec FR-005.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/i18n-core/tests/unit/i18n.translator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/i18n-core/src/i18n.translator.ts packages/i18n-core/tests/unit/i18n.translator.test.ts
git commit -m "feat(i18n): implement context-aware t() function via sessionContext (FR-005)"
```

---

### Task 4: Hardcoded Text Detector (cms:check) (FR-002, FR-007)

**Files:**

- Create: `packages/i18n-core/scripts/cms-check.ts`
- Create: `packages/i18n-core/src/i18n.schema.ts`
- Test: `packages/i18n-core/tests/unit/cms-check.test.ts`
- Test: `packages/i18n-core/tests/unit/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { detectHardcodedStrings, validateLocaleFiles } from '../../scripts/cms-check';

describe('cms:check - Hardcoded String Detection', () => {
  it('should detect hardcoded Arabic strings', () => {
    const source = `const msg = 'مرحبا بك';`;
    const violations = detectHardcodedStrings(source, 'src/example.ts');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should skip locale JSON files', () => {
    const source = `{ "greeting": "مرحبا" }`;
    const violations = detectHardcodedStrings(source, 'modules/auth/locales/ar.json');
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/i18n-core/tests/unit/cms-check.test.ts`
Expected: FAIL (detectHardcodedStrings not defined)

- [ ] **Step 3: Write minimal implementation**

Implement `detectHardcodedStrings()` for AST-based detection of hardcoded human-readable strings, and `validateLocaleFiles()` using `generateSchemaFromSource()` from `schema.ts` to enforce locale key parity between source (ar.json) and target (en.json) files.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/i18n-core/tests/unit/cms-check.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/i18n-core/scripts/cms-check.ts packages/i18n-core/src/i18n.schema.ts packages/i18n-core/tests/unit/cms-check.test.ts packages/i18n-core/tests/unit/schema.test.ts
git commit -m "feat(i18n): implement cms:check hardcoded string detector and locale validation (FR-002, FR-007)"
```
