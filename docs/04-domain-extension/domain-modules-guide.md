# Domain Modules Engineering & Extension Guide

## 1. Overview & Directory Topology
Domain modules implement business-specific capabilities (e.g., e-commerce, clinic reservations, delivery tickets) and reside under:

```text
modules/domain/<module-name>/
```

Domain modules adhere to the exact same anatomical structure, boundary isolation, and quality invariants as Kernel modules.

---

## 2. Interactive Scaffolding via Plop.js CLI

To eliminate boilerplate and ensure 100% compliance with the 10 Taboos, Tembot-v2 provides an interactive code generator:

### Scaffold a New Domain Module:
```bash
pnpm module:create
```
Prompts for:
1. Module Name (e.g., `orders`, `appointments`, `tickets`).
2. Context Cluster (e.g., `commerce-hub`, `booking-hub`).
3. Initial Capabilities (e.g., `orders:create`, `orders:cancel`).

### Scaffold a New Vertical Slice:
```bash
pnpm slice:create
```
Prompts for:
1. Target Module.
2. Slice ID (e.g., `create-order`, `cancel-booking`).
3. Slice Kind (`interactive` or `headless`).
4. Declared Entry Points (`bot`, `tma`, `dashboard`, `job`, `cron`, etc.).

---

## 3. The `module.manifest.ts` Contract

Every domain module defines a manifest declaring its dependencies, capabilities, and slices:

```typescript
import type { ModuleManifest } from '@tembot/kernel-registry';

export const manifest: ModuleManifest = {
  id: 'orders',
  version: '1.0.0',
  category: 'domain',
  context: 'commerce-hub',
  requires: ['access-control', 'audit-log'],
  optional: ['google-services'],
  capabilities: ['orders:create', 'orders:read', 'orders:cancel'],
  slices: [
    {
      sliceId: 'create-order',
      kind: 'interactive',
      entrypoints: ['bot', 'tma', 'dashboard'],
    },
  ],
};
```

---

## 4. Module Boundary Invariants

1. **Private Slices:** Other modules must never import from `modules/domain/<mod>/slices/*`.
2. **Public Barrel:** Only exports in `modules/domain/<mod>/index.ts` are accessible externally.
3. **Foreign Database Access Ban:** Direct queries or joins against another module's tables are strictly prohibited.
