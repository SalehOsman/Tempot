# 2026-07-28 Knowledge Source Build Evidence

## Scope

Implemented source-specific Knowledge Management indexing controls for the
Telegram bot.

## Completed

| Item | Evidence |
| --- | --- |
| Product build profile | `docs/product` is available as `product`. |
| Operations build profile | `docs/operations` is available as `operations`. |
| Architecture build profile | `docs/architecture` is available as `architecture`. |
| Analysis build profile | `docs/project-analysis` is available as `analysis`. |
| Full Project build profile | `docs`, `specs`, `packages`, and `modules` are available as `full-project`. |
| Custom build profile | Super admins can add `/knowledge_custom Name | relative/path | Description`. |
| Non-blocking bot UX | Long dry-run/write/confirm operations reply immediately, then send completion separately. |
| One-step write UX | `Write index` now runs the selected source directly without a second confirmation message. |
| Failure reason mapping | Embedding failures are reported as provider/vector creation failures in bot text. |

## Local Verification

| Check | Result |
| --- | --- |
| `pnpm --filter @tempot/knowledge-management test` after one-step write | Passed, 10 tests. |
| `pnpm --dir apps/bot-server exec vitest run tests/unit/knowledge-operations.provider.test.ts` | Passed, 7 tests. |
| `pnpm --filter @tempot/knowledge-management build` | Passed. |
| `pnpm lint` | Passed. |
| `pnpm cms:check` | Passed. |
| `pnpm telegram-keyboard-ux:check` | Passed. |
| `pnpm build:bot-runtime` | Passed. |
| `pnpm spec:validate` | Passed, 384/384. |

## Docker Notes

`docker-compose.yml` now mounts `./data:/app/data` and sets
`TEMPOT_KNOWLEDGE_CUSTOM_PROFILES_FILE=/app/data/knowledge-custom-profiles.json`
so custom source definitions survive image rebuilds.

## Remaining Manual Smoke

Run the rebuilt container and verify these bot paths:

| Flow | Expected Result |
| --- | --- |
| Knowledge > Sources | Shows Product, Operations, Architecture, Analysis, Full Project, and Custom Source. |
| Select source > Dry run | Immediate waiting message, then dry-run result. |
| Select source > Write index | Immediate waiting message, then completion or clear failure. |
| `/knowledge_custom Test | docs/product | Test profile` | Adds a mounted custom source and persists it under `data/`. |

## 2026-07-28 Local Failure Investigation

Docker logs showed a `knowledge_ingestion_failed` event while writing
`full-project`. The underlying public reason was `ai-core.embedding.failed`
while processing `knowledge:full-project:docs/ONBOARDING.md:6`. The bot now
surfaces this as an embedding provider/vector creation failure instead of a
generic database-oriented message.

Later Docker evidence showed the same path can surface as
`ai-core.content.chunk_failed` while the previous log line carries
`ai-core.embedding.failed`. The provider now maps both errors to the same
localized embedding-provider failure reason. Runtime checks confirmed
`GOOGLE_GENERATIVE_AI_API_KEY`, `TEMPOT_AI_PROVIDER`, and `DATABASE_URL` are
present inside the container, so the remaining failure is provider/model/quota
or outbound connectivity rather than a missing environment variable.
