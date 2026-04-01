# Architecture Decision Records (ADRs)

## Status

ADR decisions for Tempot are currently documented within each package's `research.md` file under `specs/{NNN}-{package}/research.md`. This directory serves as a centralized index.

A formal ADR migration (one file per ADR) is planned but not yet executed. Until then, use this index to locate each decision.

## ADR Index

| ADR     | Title                                         | Location                                                                            |
| ------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| ADR-003 | Gemini as Primary AI Provider                 | `specs/001-database-package/research.md` (vector dimensions rationale)              |
| ADR-009 | pdfmake for PDF Generation                    | `specs/016-document-engine-package/spec.md` (FR-001)                                |
| ADR-010 | Day.js as Date Library                        | `specs/009-regional-engine-package/research.md` (date library selection)            |
| ADR-011 | Cache Architecture (cache-manager + Keyv)     | `specs/002-shared-package/spec.md`, `specs/004-session-manager-package/research.md` |
| ADR-013 | Role-Based Access Control (CASL)              | `specs/003-auth-core-package/spec.md` (authorization rationale)                     |
| ADR-015 | Prisma Where Builder for Search               | `specs/014-search-engine-package/spec.md` (FR-001)                                  |
| ADR-016 | Vercel AI SDK as AI Abstraction               | `specs/015-ai-core-package/spec.md` (FR-001)                                        |
| ADR-017 | Dual-ORM: Prisma + Drizzle for pgvector       | `specs/001-database-package/research.md` (Drizzle rationale)                        |
| ADR-018 | Storage Engine Architecture                   | `specs/010-storage-engine-package/spec.md` (attachment management)                  |
| ADR-019 | BullMQ Queue Architecture                     | `specs/002-shared-package/research.md` (queue factory rationale)                    |
| ADR-022 | Hono Body Limit and Multipart Handling        | `specs/010-storage-engine-package/spec.md` (package boundary)                       |
| ADR-023 | Shared Package as Core Infrastructure         | `specs/002-shared-package/spec.md` (architectural requirement)                      |
| ADR-024 | countries-states-cities-database for Geo-data | `specs/009-regional-engine-package/research.md` (geo-data source)                   |
| ADR-025 | @grammyjs/menu for Interactive Lists          | `specs/014-search-engine-package/spec.md` (FR-002)                                  |
| ADR-030 | Code Limits (Rule II)                         | `specs/001-database-package/spec.md` (constitution reference)                       |
