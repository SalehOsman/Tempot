# Developer Playbook: Plop.js Scaffolding CLI

> **Authority:** `tooling/plop/plopfile.mjs`  
> **Commands:** `pnpm module:create` and `pnpm slice:create`  

---

## 1. Overview

The Tembot-v2 platform provides built-in Plop.js code generators to ensure that all newly created modules and vertical slices adhere to the **10 Engineering Taboos**, include proper manifests, and come pre-wired with structured logging, Zod validation, and forensic audit recording.

---

## 2. Scaffolding a New Module

To create a new module (domain or kernel):

```bash
pnpm module:create
```

### Interactive Prompts:
1. **Module category:** `domain` (default) or `kernel`
2. **Module name:** kebab-case slug (e.g. `loyalty-rewards`)
3. **Bounded context:** cluster name (e.g. `commerce-hub`)
4. **Description:** brief summary of the module's domain responsibility

### Generated Structure:
```
modules/domain/loyalty-rewards/
├── package.json          # Pre-wired with @tembot workspace dependencies
├── tsconfig.json         # Inherits root tsconfig.base.json
├── src/
│   ├── module.manifest.ts # ModuleManifest declaring capabilities & dependencies
│   ├── db/
│   │   └── schema.ts     # Drizzle schema with auditTimestamps & softDelete
│   └── index.ts          # Public barrel export
```

---

## 3. Scaffolding a Vertical Slice

To add a vertical slice into an existing module:

```bash
pnpm slice:create
```

### Interactive Prompts:
1. **Target module:** path to module (e.g. `modules/domain/loyalty-rewards`)
2. **Slice name:** kebab-case slug (e.g. `issue-reward-points`)
3. **Slice kind:** `interactive` | `headless`

### Generated Structure:
```
modules/domain/loyalty-rewards/src/slices/issue-reward-points/
├── dto.ts    # Zod input & output contract schemas
├── action.ts # defineAction handler with capability checks & child logger
└── index.ts  # Slice barrel export
```
