# 03 - Architecture Review

This document provides a detailed architectural review of the Tempot repository, analyzing patterns, coupling, abstraction, and compliance with modular monolithic principles.

---

## 1. Architecture Design Pattern

Tempot is designed as a **Modular Monolith** using **Clean Architecture** patterns. The system is split into independent business packages (modules) that communicate asynchronously, while sharing a common database schema and infrastructure packages.

```text
       ┌────────────────────────┐
       │   apps/bot-server      │  ◄── Interface Layer (Hono + grammY)
       └───────────┬────────────┘
                   │ Bootstraps
                   ▼
       ┌────────────────────────┐
       │ packages/module-reg.   │  ◄── Discovery & Composition
       └───────────┬────────────┘
                   │ Composes
                   ▼
 ┌───────────────────────────────────┐
 │             modules/*             │  ◄── Feature/Domain Layer
 │  ┌───────────┐     ┌───────────┐  │
 │  │ Handlers  │ ──► │ Services  │  │
 │  └───────────┘     └─────┬─────┘  │
 │                          ▼        │
 │                    ┌───────────┐  │
 │                    │Repos/Mapp.│  │
 │                    └─────┬─────┘  │
 └──────────────────────────┼────────┘
                            │ Queries
                            ▼
       ┌────────────────────────┐
       │   packages/database    │  ◄── Data/Infrastructure Layer (Prisma 7)
       └────────────────────────┘
```

---

## 2. Structural Coupling & Isolation

### App to Package Coupling
**Low and Healthy.** The application `apps/bot-server` acts strictly as an entrypoint. It imports `DependencyOrchestrator` from `@tempot/module-registry` to scan and compose modules. It does not contain any hardcoded routes for business features.

### Module to Module Coupling
**Zero Direct Coupling.** This is a major architectural strength. 
* Modules **MUST NOT** import other modules. This rule is enforced at the compilation and linting levels.
* Module-to-module communication is asynchronous and handled through `@tempot/event-bus`.
* Shared domain concepts are defined as contracts in the package layer (e.g., `@tempot/auth-core` defines global roles, while `@tempot/settings` defines key-value contracts).

### Module to Package Coupling
**High but Governed.** Modules depend heavily on infrastructure packages (e.g., `@tempot/logger`, `@tempot/session-manager`, `@tempot/input-engine`). This dependency is one-directional and healthy, as it abstracts complex logic (like queueing or RAG retrieval) away from the business modules.

---

## 3. Layer Abstraction & Clean Architecture Compliance

The architecture strictly separates concerns within each business module:

* **Telegram Handlers (`modules/*/handlers/`)**: Interface adapters that receive Telegram events (text messages, command calls, button click callbacks). They translate these events, check CASL permissions, and delegate business execution to services.
* **Domain Services (`modules/*/services/`)**: Contain core business rules, calculations, and coordination. They are decoupled from the Telegram bot runtime.
* **Repositories & Mappers (`modules/*/repositories/`)**: Abstract database operations. Mappers translate database models into domain objects (e.g., decrypting sensitive profile data in `user-protection.mapper.ts` before returning it to the application).
* **Direct database access** via Prisma client is completely restricted within repositories.

---

## 4. Architectural Strengths & Weaknesses

### Strengths
1. **Strict Boundary Control:** Enforced via `pnpm boundary:audit`, preventing circular dependencies and forbidden imports.
2. **Centralized Dependency Injection:** `deps.orchestrator.ts` wires databases, caching, session, and queues dynamically.
3. **Pluggable Event-Driven Modules:** Adding or removing a module from `runtime-manifest.json` completely activates or deactivates it without breaking compilation.
4. **Security-by-Default Infrastructure:** Sensitive fields are encrypted at the repository layer, CASL handles user permissions, and liveness/readiness routes are strictly segregated.

### Weaknesses
1. **Single Database Monolith:** While modules are isolated, they share a single database and schema. A migration mistake in one module can theoretically affect database stability for all modules.
2. **RAG Vector Schema Integration:** Vector storage is wired through Drizzle (`pgvector`) in `packages/database`, which coexists with Prisma 7. This mixed ORM approach requires careful schema synchronization.

---

## 5. Architectural Recommendations

1. **Schema Separation (Long-term):** As the project transitions toward SaaS readiness, consider adopting PostgreSQL logical schemas or separate database files per module to prevent data coupling.
2. **RAG Pipeline Decoupling:** Keep RAG indexing scripts (`ingest-docs.ts`) strictly separated from the bot server runtime. The runtime should only call `@tempot/ai-core`'s retrieval engine.
3. **Audit View Separation:** Move high-volume audit logs into a specialized time-series database or external logging service to prevent database bloat.
