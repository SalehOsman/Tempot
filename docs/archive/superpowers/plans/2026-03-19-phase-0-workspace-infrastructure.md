# Phase 0: Workspace Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a robust pnpm monorepo environment with strict TypeScript configuration, quality gates, and infrastructure containers.

**Architecture:** A multi-package monorepo using `pnpm workspaces`. Packages are isolated in `packages/`, applications in `apps/`, and domain modules in `modules/`. Quality is enforced via shared ESLint/Prettier configs and a unified Vitest workspace.

**Tech Stack:** Node.js 20+, pnpm, TypeScript 5.x, ESLint, Prettier, Husky, lint-staged, Docker, Vitest.

---

### Task 1: Monorepo Initialization (Step 0.1)

**Files:**

- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: directories `apps/`, `packages/`, `modules/`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "tempot-monorepo",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "lint": "eslint .",
    "format": "prettier --write .",
    "prepare": "husky install"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'modules/*'
```

- [ ] **Step 3: Create .npmrc**

```text
shamefully-hoist=true
```

- [ ] **Step 4: Create directory structure**

Run: `mkdir apps packages modules`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc
git commit -m "chore: initialize pnpm workspace and directory structure"
```

---

### Task 2: TypeScript & Vitest Configuration (Step 0.1)

**Files:**

- Create: `tsconfig.json` (root)
- Create: `vitest.workspace.ts`

- [ ] **Step 1: Create root tsconfig.json (Rule I)**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@tempot/*": ["packages/*/src"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Create vitest.workspace.ts**

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['packages/*', 'apps/*', 'modules/*']);
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json vitest.workspace.ts
git commit -m "chore: configure root typescript and vitest workspace"
```

---

### Task 3: Quality Gates & Linting (Step 0.2)

**Files:**

- Create: `.eslintrc.js`
- Create: `.prettierrc`
- Modify: `package.json` (lint-staged config)

- [ ] **Step 1: Create .eslintrc.js**

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
```

- [ ] **Step 2: Create .prettierrc**

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3: Configure lint-staged in package.json**

```json
"lint-staged": {
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.json": [
    "prettier --write"
  ]
}
```

- [ ] **Step 4: Initialize Husky**

Run: `pnpm exec husky install && pnpm exec husky add .husky/pre-commit "pnpm lint-staged"`

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.js .prettierrc .husky/ package.json
git commit -m "chore: setup eslint, prettier, and husky pre-commit hooks"
```

---

### Task 4: Infrastructure Containers (Step 0.3)

**Files:**

- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: ankane/pgvector:latest
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: tempot
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tempot_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

- [ ] **Step 2: Verify containers start**

Run: `docker-compose up -d`
Expected: Containers `postgres` and `redis` are running.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add docker-compose for postgres (pgvector) and redis"
```
