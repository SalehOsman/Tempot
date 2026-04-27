# @tempot/national-id-parser

Egyptian national ID parsing and validation helpers for Tempot modules.

## Purpose

This package extracts structured values from Egyptian national IDs without returning user-facing text from source code. Validation failures are returned as stable i18n/error keys so calling modules can translate them through `@tempot/i18n-core`.

## Features

- Extract gender
- Extract birth date
- Extract governorate i18n key and governorate code
- Validate national ID shape and known code ranges
- Format a national ID with a separator

## Usage

```typescript
import { parseNationalId, validateNationalId } from '@tempot/national-id-parser';

const parsed = parseNationalId('28009010100332');
// parsed.governorate === 'eg.governorates.cairo'

const validation = validateNationalId('123');
// validation.errors === ['nationalId.validation.invalidLength']
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm test:run` | Run unit tests |
| `pnpm lint` | Run ESLint on source files |

## Status

Implemented. Package checklist hardening completed for local test configuration, exact Vitest version pinning, and clean build output rules.
