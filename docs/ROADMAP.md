# Tempot Roadmap

> Single source of truth for project status. Updated after every merge.
> Constitutional reference: Rule LXXXIX.
>
> Last updated: 2026-06-16.

## Current Technical Baseline

| Area            | Baseline                            |
| --------------- | ----------------------------------- |
| Runtime         | Node.js 22.12+                      |
| Package manager | pnpm 10.33.3                        |
| Language        | TypeScript 5.9.3 strict mode        |
| Bot engine      | grammY 1.41.x                       |
| Web server      | Hono 4.x                            |
| Database        | PostgreSQL 16 + pgvector            |
| ORM             | Prisma 7.x and Drizzle for pgvector |
| AI              | Vercel AI SDK 6.x                   |
| Documentation   | Astro 6 + Starlight 0.38            |

## Current Strategic Track

Tempot Core is active as the current product. Its primary product identity is a
production-grade Telegram bot framework and single-bot starter template: a
developer should be able to configure, extend, and run one Telegram bot without
building the platform foundations again.

Tempot Cloud remains a future product track. Current work must keep the core
template ready for eventual multi-bot and SaaS evolution, but it must not make
future SaaS concerns more important than the immediate single-bot template
experience.

Current priority order:

1. Make the single Telegram bot template easy to install, configure, extend,
   test, and deploy.
2. Keep packages, modules, settings, audit metadata, and runtime boundaries
   scope-ready for future multi-bot operation.
3. Defer hosted SaaS features, tenant billing, dashboards, and managed bot
   fleet operations until a separate Product Manager decision activates that
   track.

Recently completed:

- Spec #025: `user-management` business module.
- Spec #026: architecture isolation and SaaS-readiness hardening.
- Spec #029: public `ai-core` content block contracts.
- Spec #030: public `ai-core` retrieval planning and grounded answer contracts.
- Spec #031: `ai-core` RAG runtime wiring with `retrieveWithPlan`,
  `buildAnswerState`, access-filtered retrieval outcomes, stage timings, and
  optional `rag_search` audit logging.
- Spec #032: `ai-core` RAG evaluation fixtures with deterministic retrieval hit,
  citation coverage, unauthorized leakage, and no-context scoring tests.
- Spec #013: `notifier` package - queue producer, delivery processor, worker
  factory, Telegram adapter, rate policy, and full unit test coverage.
- Spec #016: `document-engine` package with typed export contracts,
  deterministic PDF/XLSX generation, queue request handling, storage upload, and
  completion or failure events.
- Spec #017: `import-engine` package with CSV and spreadsheet parsing, injected
  schema validation, async queue workflow, valid-row batch events, invalid-row
  report requests, and completion or failure events.
- Spec #014: `search-engine` package with typed relational search planning,
  cache-backed state snapshots, pagination metadata, and adapter-driven semantic
  planning.
- Spec #008: `cms-engine` package with deterministic dynamic translation
  override contracts, protected update validation, rollback contracts, and
  optional AI-assisted draft review ports that are excluded from runtime lookup.
- Spec #036: module development platform documentation with the module catalog,
  baseline module strategy, blueprints, capability packs, Module Doctor
  direction, and Module Builder RAG Assistant plan.
- DX foundations: `pnpm tempot init`, `pnpm tempot doctor --quick`, and
  `pnpm tempot module create <module-name>`.
- Governance checks: boundary audit and module checklist audit.
- Documentation entry points were restructured for root, product, development,
  and archive documentation.
- Understand Anything is adopted as an official AI onboarding and architecture
  knowledge-graph aid, with generated context in `docs/ONBOARDING.md` and
  `docs/developer/project-knowledge-graph.md`.
- Spec #037: module tooling foundation for `pnpm tempot module doctor`,
  `module create --type`, `module create --blueprint basic`, and generated
  `module.manifest.ts`.
- Spec #038: documentation platform restructure — Starlight navigation,
  content promotion, and documentation quality automation.
- The `test-module` diagnostic scaffold has been removed.
- CI pipeline aligned to pnpm 10.33.3 and high-severity audit vulnerabilities
  resolved via dependency overrides.
- Spec #039: `template-management` closure hardening completed with repository
  contract fixes, module manifests for implemented modules, Module Doctor
  readiness, and passing module unit and integration tests.
- Spec #041: conversation runtime integration plus the inline-first
  `@tempot/input-engine` adoption standard for `bot-management` registration,
  with the duplicate manual registration state path removed.
- Spec #043: bot development runtime observability with `pnpm dev:bot`,
  command and callback diagnostics, unhandled callback fallback, non-blocking
  startup observability events, input-engine field lifecycle logs, and robust
  inline back or cancel handling inside conversational flows.
- Spec #044: module-owned Telegram navigation foundation with validated
  navigation contributions and `/start` menu rendering from active modules.
- Specs #045-#049: baseline `settings-management`, `notification-center`,
  `content-management`, `audit-viewer`, and `help-center` modules activated for
  the main Telegram menu.
- Spec #050: bot interaction observability added trace IDs, callback response
  logging, reference-code audit linkage, and an `audit-viewer` recent problems
  page for administrative diagnosis.
- Spec #052: module flow governance introduced governed `module.flow.json`
  maps, Module Doctor flow validation, documentation for reusable package
  capability selection, and a `help-center` pilot with callback runtime tests.
- Spec #052 rollout extended governed flow maps and runtime flow-map tests to
  `settings-management`, `notification-center`, and `audit-viewer`.

Active or next work:

1. Review and merge the verified Spec #053 authorization correction and Spec
   #056 quality-foundation slice from
   `codex/remediation-sequence-reconciliation`.
2. Integrate the verified Spec #055 atomicity and normal soft-delete foundation
   into the Spec #054 protected-data branch, then rerun the combined gates.
3. Execute the approved Spec #054 protected-data implementation while keeping
   irreversible plaintext retirement blocked until migration, restore, and key
   rotation evidence satisfies the separate T032/T045 approval gate.
4. Keep `template-management` useful as a product capability and developer
   reference, but avoid marketplace or SaaS-only expansion until the single-bot
   template experience is complete.
5. `bot-management` (Spec #040) remains a future-facing operational module.
   Keep it useful as a lightweight bot profile registry for the template, but
   do not let multi-bot SaaS management displace the current single-bot
   framework priority.
6. Consider future RAG evaluation expansion for latency, token usage, and cost
   only after a separate Product Manager decision.
7. Roll out governed `module.flow.json` maps and bot runtime flow tests to the
   remaining active modules one module at a time, starting with
   `content-management`, `user-management`, `template-management`, and
   `bot-management`.

## Production Readiness Remediation Program

The comprehensive audit completed on 2026-06-07 identified confirmed
authorization, privacy, data-integrity, quality-gate, and delivery risks. The
approved remediation design is documented in
`docs/project-analysis/2026-06-07/remediation-program.md`.

A follow-up Technical Advisor analysis on 2026-06-10
(`docs/analysis-2026-06-10/`) reconfirms the program scope, attaches a
phase-based fix plan, an improvement roadmap, and a quantified scoring of all
project axes. The 2026-06-15 reconciliation corrected its literal execution
order and its pnpm 11 recommendation: pnpm 10.33.3 is the compatible pinned
release for the constitutional Node.js 22.12 minimum.

Implementation claims below distinguish verified branch work from work merged
to `main`. Production remains blocked until every P0/P1 remediation gate is
complete and merged.

| Recommended order | Spec                                       | Scope                                                                             | Priority   | Status                                                                                                                                            |
| ----------------: | ------------------------------------------ | --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|                 1 | #053 `authorization-correction`            | Correct global authorization and role/action enforcement                          | P0         | Verified on reconciliation branch; awaiting merge approval                                                                                        |
|                 2 | #056 `quality-gates-hardening` foundation  | App test visibility, docs freshness, toolchain and source conformance             | P1 enabler | Verified on reconciliation branch; coverage remains non-blocking                                                                                  |
|                 3 | #055 `data-integrity-hardening` foundation | Atomic identity updates and soft-delete invariants required by migration work     | P1         | Implemented and verified on `codex/055-data-integrity-hardening`; integration into #054 in progress                                                |
|                 4 | #054 `sensitive-data-protection` cutover   | Encrypt protected data, minimize audit, migrate and rotate keys                   | P0         | Technical-advisor review remediation verified; destructive execution approved on 2026-06-16; target backup rehearsal and final gates pending       |
|                 5 | #055 `data-integrity-hardening` completion | Repository boundaries, aggregate counts, and pagination                           | P1         | Not started                                                                                                                                       |
|                 6 | #056 `quality-gates-hardening` completion  | Close component coverage debt and make the coverage job blocking                  | P1         | In progress; baseline is 23 failures and 9 warnings across 103 components                                                                         |
|                 7 | #057 `production-delivery-hardening`       | Startup, HTTP, health, dependencies, image, supply chain, deployment and recovery | P1         | Not started; final production gate                                                                                                                |

Production go/no-go requires:

- zero open Critical findings;
- no unapproved High security or production-readiness findings;
- verified protected-data migration and key rotation;
- complete application CI and component coverage gates;
- a minimal signed immutable image;
- passing staging migration, smoke, observability, backup/restore, and rollback
  or forward-fix rehearsal.

## Phase Summary

| Phase       | Scope                                               | Status                                                                                          |
| ----------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Phase 0     | Workspace and monorepo foundation                   | Complete                                                                                        |
| Phase 1     | Core bedrock packages                               | Complete; package inventory reconciled                                                          |
| Phase 2     | Module infrastructure and bot-server reconstruction | Complete                                                                                        |
| Phase 3     | Business modules                                    | Started; `user-management` and `template-management` implemented                                |
| Phase 3A    | Architecture isolation and SaaS readiness           | Complete                                                                                        |
| Phase 3B    | Next business module and supporting packages        | Started; `template-management` closure complete                                                 |
| Phase 4     | Dashboard, mini apps, and additional frontends      | Not started                                                                                     |
| Phase 5     | Enterprise infrastructure                           | Not started                                                                                     |
| Phase 6     | Observability and developer experience expansion    | Active through DX tooling, bot runtime observability, and admin problem inspection              |
| Remediation | Specs #053-#057 production-readiness corrections    | Stage 1 verified on reconciliation branch; #055 foundation is being integrated into #054; target backup rehearsal and final release gates remain |

## Package Status

### Complete

- `@tempot/shared`
- `@tempot/logger`
- `@tempot/database`
- `@tempot/event-bus`
- `@tempot/auth-core`
- `@tempot/session-manager`
- `@tempot/i18n-core`
- `@tempot/regional-engine`
- `@tempot/storage-engine`
- `@tempot/input-engine`
- `@tempot/ux-helpers`
- `@tempot/ai-core`
- `@tempot/sentry`
- `@tempot/settings`
- `@tempot/module-registry`
- `@tempot/national-id-parser` - Egyptian national ID parsing and validation
  helpers used by `user-management`.
- `@tempot/notifier` - completed 2026-04-30 (Spec #013).
- `@tempot/document-engine` - completed 2026-05-06 (Spec #016).
- `@tempot/import-engine` - completed 2026-05-06 (Spec #017).
- `@tempot/search-engine` - completed 2026-05-06 (Spec #014).
- `@tempot/cms-engine` - completed 2026-05-06 (Spec #008 AI-ready MVP).

### Activated Package Execution Sequence

Product Manager decision recorded 2026-05-06: activate the following packages
for SpecKit repair and sequential Superpowers implementation. Rule LXXXV still
applies: only one package may be in active execution at a time.

| Order | Package         | Spec directory                | Status                 |
| ----- | --------------- | ----------------------------- | ---------------------- |
| 1     | document-engine | `016-document-engine-package` | Implemented and merged |
| 2     | import-engine   | `017-import-engine-package`   | Implemented and merged |
| 3     | search-engine   | `014-search-engine-package`   | Implemented and merged |
| 4     | cms-engine      | `008-cms-engine-package`      | Implemented and merged |

### Deferred Under Rule XC

No package remains deferred under Rule XC after the Spec #008 activation.

## Application Status

| App               | Status                                        |
| ----------------- | --------------------------------------------- |
| `apps/bot-server` | Implemented and wired to package dependencies |
| `apps/docs`       | Implemented with Astro 6 and Starlight        |
| Dashboard         | Planned                                       |
| Mini apps         | Planned                                       |

## Business Modules

| Module                | Spec | Status      |
| --------------------- | ---- | ----------- |
| `user-management`     | #025 | Implemented |
| `template-management` | #039 | Implemented |
| `settings-management` | #045 | Implemented |
| `notification-center` | #046 | Implemented |
| `content-management`  | #047 | Implemented |
| `audit-viewer`        | #048 | Implemented |
| `help-center`         | #049 | Implemented |

The next business module must start with SpecKit artifacts, Superpowers
execution, `pnpm boundary:audit`, and `pnpm module:checklist`.

Baseline module strategy documented by Spec #036:

| Module                | Type          | Status                                                  |
| --------------------- | ------------- | ------------------------------------------------------- |
| `user-management`     | Core platform | Implemented                                             |
| `template-management` | Product       | Implemented                                             |
| `bot-management`      | Operational   | Lightweight registry now; future SaaS bridge            |
| `content-management`  | Product       | Implemented baseline                                    |
| `notification-center` | Operational   | Implemented baseline                                    |
| `audit-viewer`        | Operational   | Implemented baseline plus recent bot problem inspection |
| `settings-management` | Core platform | Implemented baseline                                    |
| `help-center`         | Core platform | Implemented baseline                                    |

## Architecture and Governance Artifacts

Current active references:

- Architecture spec: `docs/architecture/tempot_architecture.md`
- ADR index: `docs/architecture/adr/README.md`
- Boundary audit: `docs/architecture/boundaries/`
- AI RAG methodology: `docs/architecture/ai-rag-methodology.md`
- SaaS readiness: `docs/architecture/saas-readiness.md`
- SaaS migration map: `docs/architecture/saas-migration-map.md`
- Telegram Managed Bots assessment:
  `docs/architecture/telegram-managed-bots-assessment.md`
- Template marketplace plan: `docs/architecture/template-marketplace.md`
- Documentation cleanup plan:
  `docs/developer/documentation-cleanup-plan.md`
- Documentation restructure plan:
  `docs/developer/documentation-restructure-plan.md`
- Project knowledge graph:
  `docs/developer/project-knowledge-graph.md`
- Module development catalog:
  `docs/developer/module-development-catalog.md`

## Quality Gates Before Merge

Use the gates relevant to the change:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm docs:check
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm authorization:check
pnpm module:checklist
pnpm source:conformance
pnpm toolchain:audit
pnpm audit --audit-level=high
```

`pnpm test:coverage` currently reports the complete baseline but remains
non-blocking in CI until the 23 service/handler failures are corrected during
the remaining Spec #056 execution. Thresholds have not been reduced.

For documentation-only changes, `pnpm spec:validate` is still relevant because
Tempot enforces code-documentation parity.

## Version Vision

| Version | Theme                                        | Status                                                       |
| ------- | -------------------------------------------- | ------------------------------------------------------------ |
| v1.0    | MVP bot framework core                       | In development; blocked by Specs #053-#057 remediation gates |
| v1.1    | Developer experience and templates           | Planned                                                      |
| v1.2    | AI, RAG, anomaly detection, and smart search | Planned                                                      |
| v1.3    | Mini apps and component library              | Planned                                                      |
| v1.4    | Observability dashboard                      | Planned                                                      |
| v2.0    | Multi-bot SaaS and enterprise platform       | Future vision                                                |
