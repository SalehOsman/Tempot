# Tempot Roadmap

> Single source of truth for project status. Updated after every merge.
> Constitutional reference: Rule LXXXIX.
>
> Last updated: 2026-04-29.

## Current Technical Baseline

| Area            | Baseline                            |
| --------------- | ----------------------------------- |
| Runtime         | Node.js 22.12+                      |
| Package manager | pnpm 10+                            |
| Language        | TypeScript 5.9.3 strict mode        |
| Bot engine      | grammY 1.41.x                       |
| Web server      | Hono 4.x                            |
| Database        | PostgreSQL 16 + pgvector            |
| ORM             | Prisma 7.x and Drizzle for pgvector |
| AI              | Vercel AI SDK 6.x                   |
| Documentation   | Astro 6 + Starlight 0.38            |

## Current Strategic Track

Tempot Core is active as the current product. The future Tempot Cloud SaaS path
is documented but not yet implemented.

Recently completed:

- Spec #025: `user-management` business module.
- Spec #026: architecture isolation and SaaS-readiness hardening.
- Spec #029: public `ai-core` content block contracts.
- DX foundations: `pnpm tempot init`, `pnpm tempot doctor --quick`, and
  `pnpm tempot module create <module-name>`.
- Governance checks: boundary audit and module checklist audit.
- Documentation entry points were restructured for root, product, development,
  and archive documentation.

Active or next work:

1. Complete the activated `notifier` package workstream.
2. Execute Spec #030: add retrieval planning and grounded answer state contracts
   to `ai-core` as the next implementation slice from Spec #027.
3. Use Spec #027 as the approved Tempot-native multimodal RAG methodology
   inspired by RAG-Anything, without adopting its Python runtime.
4. Decide whether `search-engine`, `document-engine`, or `import-engine` should
   be activated after the RAG methodology gate.
5. Continue Phase 3B business module planning after package readiness decisions.

## Phase Summary

| Phase    | Scope                                               | Status                                          |
| -------- | --------------------------------------------------- | ----------------------------------------------- |
| Phase 0  | Workspace and monorepo foundation                   | Complete                                        |
| Phase 1  | Core bedrock packages                               | Mostly complete; deferred package policy active |
| Phase 2  | Module infrastructure and bot-server reconstruction | Complete                                        |
| Phase 3  | Business modules                                    | Started; `user-management` implemented          |
| Phase 3A | Architecture isolation and SaaS readiness           | Complete                                        |
| Phase 3B | Next business module and supporting packages        | In planning                                     |
| Phase 4  | Dashboard, mini apps, and additional frontends      | Not started                                     |
| Phase 5  | Enterprise infrastructure                           | Not started                                     |
| Phase 6  | Observability and developer experience expansion    | Partially started through DX tooling            |

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

### Active

- `@tempot/notifier` - activated from Rule XC deferred status on 2026-04-29.

### Deferred Under Rule XC

These packages are intentionally deferred until a business module or roadmap
decision activates them:

| #   | Package         | Spec state     | Status      |
| --- | --------------- | -------------- | ----------- |
| 8   | cms-engine      | Forward design | Not started |
| 15  | search-engine   | Forward design | Not started |
| 17  | document-engine | Forward design | Not started |
| 19  | import-engine   | Forward design | Not started |

Deferred packages are exempt from blocking `pnpm spec:validate` critical
failures until activation is recorded here.

## Application Status

| App               | Status                                        |
| ----------------- | --------------------------------------------- |
| `apps/bot-server` | Implemented and wired to package dependencies |
| `apps/docs`       | Implemented with Astro 6 and Starlight        |
| Dashboard         | Planned                                       |
| Mini apps         | Planned                                       |

## Business Modules

| Module            | Spec | Status      |
| ----------------- | ---- | ----------- |
| `user-management` | #025 | Implemented |

The next business module must start with SpecKit artifacts, Superpowers
execution, `pnpm boundary:audit`, and `pnpm module:checklist`.

## Architecture and Governance Artifacts

Current active references:

- Architecture spec: `docs/archive/tempot_v11_final.md`
- ADR index: `docs/archive/architecture/adr/README.md`
- Boundary audit: `docs/archive/architecture/boundaries/`
- AI RAG methodology: `docs/archive/architecture/ai-rag-methodology.md`
- SaaS readiness: `docs/archive/architecture/saas-readiness.md`
- SaaS migration map: `docs/archive/architecture/saas-migration-map.md`
- Telegram Managed Bots assessment:
  `docs/archive/architecture/telegram-managed-bots-assessment.md`
- Template marketplace plan: `docs/archive/architecture/template-marketplace.md`
- Documentation cleanup plan:
  `docs/archive/developer/documentation-cleanup-plan.md`

## Quality Gates Before Merge

Use the gates relevant to the change:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm audit --audit-level=high
```

For documentation-only changes, `pnpm spec:validate` is still relevant because
Tempot enforces code-documentation parity.

## Version Vision

| Version | Theme                                        | Status         |
| ------- | -------------------------------------------- | -------------- |
| v1.0    | MVP bot framework core                       | In development |
| v1.1    | Developer experience and templates           | Planned        |
| v1.2    | AI, RAG, anomaly detection, and smart search | Planned        |
| v1.3    | Mini apps and component library              | Planned        |
| v1.4    | Observability dashboard                      | Planned        |
| v2.0    | Multi-bot SaaS and enterprise platform       | Future vision  |
