# 02 - Project Structure Analysis

This document reviews the file and folder layout of the Tempot repository, evaluating modularity, layer isolation, scalability, and clean boundaries.

---

## 1. Repository Layout Overview

Tempot is structured as a strict monorepo, organized into three primary logic-containing directories (`apps/`, `packages/`, and `modules/`), complemented by governance, specification, and documentation directories.

```text
tempot-monorepo/
├── apps/               # Deployable applications
│   ├── bot-server/     # Hono + grammY Telegram bot application
│   └── docs/           # Astro/Starlight documentation app
├── packages/           # Reusable core/domain infrastructure packages
│   ├── ai-core/        # Vercel AI SDK, RAG indexing & retrieval
│   ├── database/       # Prisma 7 schema, migrations & base repositories
│   ├── logger/         # Pino structured logging
│   └── ...             # 19 other packages (shared, session-manager, etc.)
├── modules/            # Business modules (domain logic)
│   ├── user-management/# Profile & active role management
│   ├── membership-management/# Membership requests & visitor gate
│   └── ...             # 7 other business modules
├── specs/              # SpecKit specification artifacts (#001-#064)
├── docs/               # Global architecture, ops, and roadmap documents
├── scripts/            # CI, verification, and developer tooling scripts
├── runtime/            # Auto-generated runtime inventory manifest
└── .specify/           # SpecKit constitution, roles, and feature tracking
```

---

## 2. Structural Assessment

### Is the structure logical?
**Yes.** The separation is extremely clear and standard for modern TypeScript monorepos. Applications in `apps/` represent the deployment targets. Domain-specific, reusable utilities live in `packages/`, while cohesive business capabilities (features) are grouped into independent directories under `modules/`.

### Is there a clear separation between layers?
**Yes.** The codebase adheres to Clean Architecture layers:
1. **Infrastructure/Interface Layer (`apps/bot-server`)**: Handles server initialization, middleware binding, routing, and bot runtime bootstrapping. It has no direct business logic.
2. **Business/Domain Layer (`modules/*`)**: Houses features, services, database repositories, callback handlers, and local i18n resources. Each module acts as a self-contained slice of capability.
3. **Bedrock Package Layer (`packages/*`)**: Contains generic infrastructure services (event bus, database wrappers, logging, session storage, notifier queue) that modules use.

### Is there a mix of business logic, infrastructure, and UI/API?
**No.** There is a strict boundary enforced.
* **No Direct Database Access in Handlers:** Handlers call service classes; services use repository classes; repositories talk to Prisma/Drizzle.
* **Event Bus Isolation:** Modules are prohibited from directly importing or calling other modules. Communication occurs asynchronously through `@tempot/event-bus`.
* **No Raw Prisma in Modules:** Direct Prisma imports in modules are audited by `pnpm boundary:audit`.

### Is the project expandable?
**Highly expandable.**
* **Adding Business Logic:** To add a new feature, a developer creates a module under `modules/` using the `pnpm tempot module create` command. The CLI generates a compliant blueprint including the manifest and registration.
* **Adding Interfaces:** Additional deployment surfaces (e.g., a React dashboard or a Next.js admin panel) can be added inside `apps/` without modifying core business packages.

---

## 3. Findings & Recommendations

### Reorganization Findings

| Finding | Severity | Description / Evidence | Impact | Proposed Reorganization |
| :--- | :---: | :--- | :--- | :--- |
| **Historical Analysis Path Drift** | Low | Deletion of old `docs/analysis-*` and recreation of `docs/project-analysis/analysis-*` is complete, but `git status` shows deleted files. | Minor confusion in workspace tracking. | Commit these file movements to clean git status permanently. |
| **AI Context File Duplication** | Low | The root has `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` containing duplicated context. | Extra context payload and potential drift. | Consolidate core instructions into `AGENTS.md` and make tool-specific files point to it. |
| **Spec Numbering Gaps** | Low | Specs #022 and #033 are missing from the `specs/` directory. | Gap in sequential spec mapping. | Add placeholder specs detailing why they were skipped (e.g., cancelled features). |

### Recommendations for Future Expansion

1. **Keep `apps/` Thin:** Continue the practice of delegating all initialization logic in `apps/bot-server` to package orchestration classes (`DependencyOrchestrator`).
2. **Strict Manifest Governance:** Ensure the `runtime/runtime-manifest.json` is updated by CI to only bundle modules that are actively enabled for production.
