# @tempot/i18n-core

> i18next configuration with Arabic as primary language. Enforces the i18n-Only rule.

## Purpose

- Configures i18next with modular locale loading (per-package and per-module namespaces)
- Provides the `t()` function used everywhere in the codebase
- Enforces the i18n-Only rule — zero hardcoded user-facing text in `.ts` files
- Context-aware translation — reads user language from `sessionContext`
- Supports interpolation, pluralisation, and RTL formatting
- `pnpm cms:check` script validates translation completeness in CI/CD

## Phase

Phase 3 — Presentation Layer

## Dependencies

| Package | Purpose |
|---------|---------|
| `i18next` 23.x | Internationalisation framework |
| `@tempot/session-manager` | User language from session context |
| `@tempot/logger` | Missing key warnings |

## Locale Structure

```
packages/i18n-core/locales/
├── ar/
│   ├── common.json       # Shared strings
│   ├── errors.json       # Error messages
│   └── notifications.json # Notification templates
└── en/
    ├── common.json
    ├── errors.json
    └── notifications.json

modules/{name}/locales/
├── ar.json               # Module strings (Arabic)
└── en.json               # Module strings (English)
```

## API

```typescript
import { t, initI18n } from '@tempot/i18n-core';

// Translate with user context (reads language from sessionContext)
const message = t(ctx, 'common.welcome', { name: 'أحمد' });
// → "مرحباً أحمد!" (if user language is 'ar')
// → "Welcome, Ahmed!" (if user language is 'en')

// Pluralisation
const msg = t(ctx, 'invoices.count', { count: 5 });
// → "5 فواتير"

// Fallback chain: user language → default language → error key
```

## Scripts

```bash
pnpm cms:check              # Check all translations complete
pnpm cms:check --module X   # Check specific module
pnpm cms:report             # Report missing keys
```

## Rules

- ⚠️ Never hardcode Arabic or English strings in `.ts` files
- All `t()` calls use i18n keys, never raw strings
- Every new module must create both `ar.json` and `en.json` on day one

## ADRs

- ADR-014 — i18next backends for CMS Engine

## Status

⏳ **Not yet implemented** — Phase 3
