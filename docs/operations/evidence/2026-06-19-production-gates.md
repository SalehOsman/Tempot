# Production Gate Evidence - 2026-06-19

## Release Identity

- **Release:** Spec #057 production-delivery hardening gate continuation.
- **Spec:** `057-production-delivery-hardening`.
- **Git baseline:** `origin/main` at `451231518816ccefc9141a26472acad3e02c8014`.
- **Published image tested:** `ghcr.io/salehosman/tempot-bot-server@sha256:9fec6332d816ce91784df51b8e83889c6c30962a603af4a47a5b3e99184fce01`.
- **Local fixed image tested:** `tempot-bot-server:057-staging-gates`.
- **Environment:** Local isolated rehearsal only; no external staging target or staging secrets were present in the workspace environment.
- **Date:** 2026-06-19.
- **Operator:** Codex, acting under Project Manager approval.

## Environment Discovery

- No `TEMPOT_*`, `STAGING_*`, `DATABASE_URL`, `REDIS_URL`, `BOT_TOKEN`, `WEBHOOK_*`,
  `SENTRY_*`, monitoring, alert, or backup target environment variables were
  present in the worktree process environment.
- No `.env` or `.env.staging` file was present in the worktree.
- Therefore, an actual external staging deployment, staging webhook smoke,
  staging monitoring capture, and production go/no-go signature could not be
  completed truthfully in this session.

## Build And Supply Chain Evidence

- GitHub CI for `main` passed on run `27795814551`.
- GitHub Docker workflow for `main` passed on run `27795814550`.
- The published image digest above was pulled successfully with Docker.
- Existing workflow evidence records Trivy scan, Cosign signing, and Cosign
  verification for the published digest.

## Runtime Rehearsal Findings

- Migration deploy from the published image against an isolated PostgreSQL 16
  plus pgvector database passed.
- Applied migrations:
  - `20260426013552_add_user_profile`
  - `20260523000000_add_interaction_events`
  - `20260608234000_expand_sensitive_data_protection`
  - `20260608235500_add_sensitive_migration_checkpoints`
- The published image failed before opening HTTP because `bot-management`
  imports `zod` from copied runtime module files, but the runner image did not
  provide `zod` at `/app/node_modules`.
- The branch fix adds `zod` as a production dependency of `bot-server` and adds
  a runtime artifact policy test.
- A local rebuilt image from the branch successfully imported
  `/app/modules/bot-management/dist/flows/lifecycle-reason.flow.js`.
- The local rebuilt image then proceeded through dependency build, database
  connection, super-admin bootstrap, cache warmup, discovery, validation, and
  all module handler loading.
- Full HTTP liveness/readiness smoke remained blocked locally because command
  registration calls Telegram and only a dummy smoke token was available.

## Backup And Restore Evidence

- Backup/restore was rehearsed against the isolated rehearsal database.
- Backup file: `.tmp-release-gates/tempot_db.dump`.
- Backup size: `22267` bytes.
- Restore target database: `tempot_restore`.
- Restore probe marker after restore:
  `backup-restore-2026-06-19`.
- Restored Prisma migration count: `4`.
- Result: backup/restore rehearsal passed for the isolated rehearsal database.

## Rollback And Forward-Fix Evidence

- No previous approved staging or production image digest was available in the
  environment.
- No external staging target was available.
- Result: rollback or forward-fix rehearsal is still **not complete** for a real
  target environment.

## Monitoring And Alert Evidence

- No monitoring or alert endpoint configuration was present.
- No Sentry DSN, platform alert route, Prometheus/Grafana endpoint, or
  independent alert channel reference was available.
- Result: monitoring and independent alert evidence is still **not complete**.

## Cutover Evidence

- Final cutover plan is documented in
  `docs/operations/production-cutover-plan.md`.
- Actual cutover remains blocked until staging deployment, rollback rehearsal,
  monitoring evidence, and Product Manager go/no-go approval are available.

## Decision

- **Decision:** No-Go.
- **Reason:** external staging deployment, staging health/readiness/webhook
  smoke, monitoring/alerts evidence, rollback or forward-fix rehearsal, and
  Product Manager final approval are not available. The previously published
  image also failed local runtime rehearsal due to a missing runtime dependency.
- **Required next artifact:** a new CI-built, scanned, signed image from this
  branch after the `zod` runtime dependency fix.
