# Tempot Project Knowledge Graph

This document summarizes the current Understand Anything graph generated for Tempot.

## Adoption Status

This graph is an official Tempot AI onboarding and project-context aid. It is
approved for helping AI tools and developers understand repository structure,
relationships, and navigation paths before deeper source review.

It does not replace the constitution, role framework, SpecKit artifacts,
roadmap, ADRs, or source code. Treat it as a structured map of the current
project context. When the map conflicts with an authoritative source, update the
map or its generation process.

## Snapshot

| Metric       | Value                                    |
| ------------ | ---------------------------------------- |
| Generated at | 2026-05-07T09:40:21.742Z |
| Git commit   | 690f7297f2cf05c36b14695ef7b24c168c65a649 |
| Nodes        | 1127                                     |
| Edges        | 1911                                     |
| Layers       | 5                                        |
| Tour steps   | 5                                        |

## Edge Types

| Edge type  | Count |
| ---------- | ----- |
| contains   | 687   |
| publishes  | 467   |
| imports    | 352   |
| documents  | 242   |
| depends_on | 70    |
| configures | 61    |
| subscribes | 32    |

## Workspace Dependencies

| Workspace          | Kind     | Detected dependencies                                                                                                            |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| bot-server         | apps     | Strict TypeScript, auth-core, database, event-bus, i18n-core, logger, module-registry, sentry, session-manager, settings, shared |
| docs               | apps     | Strict TypeScript, ai-core, shared                                                                                               |
| ai-core            | packages | Strict TypeScript, database, shared                                                                                              |
| auth-core          | packages | Strict TypeScript, shared                                                                                                        |
| cms-engine         | packages | Strict TypeScript, shared                                                                                                        |
| database           | packages | Strict TypeScript, shared                                                                                                        |
| document-engine    | packages | Strict TypeScript, shared                                                                                                        |
| event-bus          | packages | Strict TypeScript, shared                                                                                                        |
| i18n-core          | packages | Strict TypeScript, shared                                                                                                        |
| import-engine      | packages | Strict TypeScript, shared                                                                                                        |
| input-engine       | packages | Strict TypeScript, shared                                                                                                        |
| logger             | packages | Strict TypeScript, database, shared                                                                                              |
| module-registry    | packages | Strict TypeScript, shared                                                                                                        |
| national-id-parser | packages | Strict TypeScript                                                                                                                |
| notifier           | packages | Strict TypeScript, shared                                                                                                        |
| regional-engine    | packages | Strict TypeScript, shared                                                                                                        |
| search-engine      | packages | Strict TypeScript, shared                                                                                                        |
| sentry             | packages | Strict TypeScript, shared                                                                                                        |
| session-manager    | packages | Strict TypeScript, database, shared                                                                                              |
| settings           | packages | Strict TypeScript, shared                                                                                                        |
| shared             | packages | Strict TypeScript                                                                                                                |
| storage-engine     | packages | Strict TypeScript, database, shared                                                                                              |
| ux-helpers         | packages | Strict TypeScript, i18n-core, logger, shared                                                                                     |
| test-module        | modules  | Event-driven modules, Strict TypeScript, module-registry                                                                         |
| user-management    | modules  | Event-driven modules, Strict TypeScript, auth-core, database, module-registry, national-id-parser, shared                        |

## Event Relationships

The graph detects event relationships from event-like string contracts and nearby publish/subscribe calls.

| Source                   | Type      | Target                                  |
| ------------------------ | --------- | --------------------------------------- |
| deps.factory.ts          | publishes | bot-server.startup.database_unreachable |
| bot-server               | publishes | bot-server.startup.database_unreachable |
| deps.orchestrator.ts     | publishes | bot-server.startup.database_unreachable |
| orchestrator.ts          | publishes | system.startup.completed                |
| bot-server               | publishes | system.startup.completed                |
| shutdown.ts              | publishes | system.shutdown.initiated               |
| bot-server               | publishes | system.shutdown.initiated               |
| shutdown.ts              | publishes | system.shutdown.completed               |
| bot-server               | publishes | system.shutdown.completed               |
| e2e.test.ts              | publishes | system.startup.completed                |
| e2e.test.ts              | publishes | system.shutdown.completed               |
| startup-sequence.test.ts | publishes | system.startup.completed                |
| deps.factory.test.ts     | publishes | bot-server.startup.database_unreachable |
| lifecycle-events.test.ts | publishes | system.startup.completed                |
| lifecycle-events.test.ts | publishes | system.shutdown.initiated               |
| lifecycle-events.test.ts | publishes | system.shutdown.completed               |
| lifecycle-events.test.ts | publishes | bot-server.module.handler_failed        |
| bot-server               | publishes | bot-server.module.handler_failed        |
| orchestrator.test.ts     | publishes | system.startup.completed                |
| shutdown.test.ts         | publishes | system.shutdown.initiated               |
| ai-core.errors.ts        | publishes | ai-core.provider.unavailable            |
| ai-core                  | publishes | ai-core.provider.unavailable            |
| ai-core.errors.ts        | publishes | ai-core.provider.auth_failed            |
| ai-core                  | publishes | ai-core.provider.auth_failed            |
| ai-core.errors.ts        | publishes | ai-core.provider.timeout                |
| ai-core                  | publishes | ai-core.provider.timeout                |
| ai-core.errors.ts        | publishes | ai-core.provider.unknown                |
| ai-core                  | publishes | ai-core.provider.unknown                |
| ai-core.errors.ts        | publishes | ai-core.resilience.circuit_open         |
| ai-core                  | publishes | ai-core.resilience.circuit_open         |
| ai-core.errors.ts        | publishes | ai-core.resilience.rate_limited         |
| ai-core                  | publishes | ai-core.resilience.rate_limited         |
| ai-core.errors.ts        | publishes | ai-core.resilience.bulkhead_full        |
| ai-core                  | publishes | ai-core.resilience.bulkhead_full        |
| ai-core.errors.ts        | publishes | ai-core.embedding.failed                |
| ai-core                  | publishes | ai-core.embedding.failed                |
| ai-core.errors.ts        | publishes | ai-core.embedding.dimension_mismatch    |
| ai-core                  | publishes | ai-core.embedding.dimension_mismatch    |
| ai-core.errors.ts        | publishes | ai-core.content.size_exceeded           |
| ai-core                  | publishes | ai-core.content.size_exceeded           |
| ai-core.errors.ts        | publishes | ai-core.content.type_invalid            |
| ai-core                  | publishes | ai-core.content.type_invalid            |
| ai-core.errors.ts        | publishes | ai-core.content.chunk_failed            |
| ai-core                  | publishes | ai-core.content.chunk_failed            |
| ai-core.errors.ts        | publishes | ai-core.content.sanitize_failed         |
| ai-core                  | publishes | ai-core.content.sanitize_failed         |
| ai-core.errors.ts        | publishes | ai-core.content_source.invalid          |
| ai-core                  | publishes | ai-core.content_source.invalid          |
| ai-core.errors.ts        | publishes | ai-core.content_block.invalid           |
| ai-core                  | publishes | ai-core.content_block.invalid           |
| ai-core.errors.ts        | publishes | ai-core.content_block.raw_pii           |
| ai-core                  | publishes | ai-core.content_block.raw_pii           |
| ai-core.errors.ts        | publishes | ai-core.content_block.not_embeddable    |
| ai-core                  | publishes | ai-core.content_block.not_embeddable    |
| ai-core.errors.ts        | publishes | ai-core.rag.no_results                  |
| ai-core                  | publishes | ai-core.rag.no_results                  |
| ai-core.errors.ts        | publishes | ai-core.rag.search_failed               |
| ai-core                  | publishes | ai-core.rag.search_failed               |
| ai-core.errors.ts        | publishes | ai-core.rag.answer_invalid              |
| ai-core                  | publishes | ai-core.rag.answer_invalid              |

## How To Use This Graph

- Use package dependency edges to understand allowed workspace dependencies.
- Use module contains/imports edges to inspect command, handler, service, and repository structure.
- Use SpecKit document edges to understand which specs introduced or reconciled each package/module.
- Use event edges to review event-driven communication points.

## Quality Notes

- This graph is deterministic and generated from current repository files.
- It complements, but does not replace, SpecKit artifacts, the constitution, ADRs, or source code review.
- A graph with zero edges is not acceptable for professional architecture documentation.
