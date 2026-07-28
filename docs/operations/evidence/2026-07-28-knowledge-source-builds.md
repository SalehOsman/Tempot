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

## Local Verification

| Check | Result |
| --- | --- |
| `pnpm --filter @tempot/knowledge-management test` | Passed, 10 tests. |
| `pnpm --dir apps/bot-server exec vitest run tests/unit/knowledge-operations.provider.test.ts` | Passed, 6 tests. |
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
| Select source > Write index | Immediate waiting message, then confirmation. |
| Confirm write | Immediate waiting message, then completion or clear failure. |
| `/knowledge_custom Test | docs/product | Test profile` | Adds a mounted custom source and persists it under `data/`. |
