# Spec 057 Implementation Report

**Feature:** `057-production-delivery-hardening`
**Branch:** `codex/057-production-delivery-hardening`
**Started:** 2026-06-17
**Status:** Phase 1 baseline complete; Phase 2 startup tests and first runtime fixes in progress.

## Handoff Gate

| Gate | Result | Evidence |
| --- | --- | --- |
| Worktree | PASS | `F:\Tempot_Worktrees\057-production-delivery-hardening` |
| Branch | PASS | `codex/057-production-delivery-hardening` |
| SpecKit prerequisites | PASS | `check-prerequisites.ps1` found `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, and `tasks.md` |
| Spec validation | PASS | `pnpm spec:validate` returned 330/330 checks passed |
| Open clarification markers | PASS | No `NEEDS CLARIFICATION`, `TODO`, `TBD`, `???`, or `<placeholder>` markers found under `specs/057-production-delivery-hardening` |
| Package install | PASS | `pnpm install --frozen-lockfile` completed after clearing a Windows symlink contention retry |

## Baseline Findings

### Startup

- `apps/bot-server/src/startup/deps.factory.ts` starts `initI18n()` inside
  `Promise.all` but does not consume or validate its result. This is the first
  target for the failing startup tests in T006.
- `buildDeps()` connects Prisma before the orchestrator's own
  `connectDatabase` step, creating two database connection paths that must be
  reconciled before readiness can be truthful.
- `apps/bot-server/src/startup/orchestrator.ts` has typed fatal steps for
  config, database, super-admin bootstrap, discovery, validation, handlers, and
  command registration. Cache warming is currently degraded, not fatal.
- Startup does not expose an explicit readiness activation state. HTTP listen
  happens before the final polling start path, and readiness currently depends
  on `/health` probes rather than a startup state machine.

### HTTP and Health

- `apps/bot-server/src/server/hono.factory.ts` registers health and webhook
  routes only. There is no global secure-header, request-size, CORS, rate-limit,
  or safe-error middleware yet.
- `GET /health` currently returns detailed subsystem checks, version, uptime,
  probe latency, and probe error messages to any caller.
- `apps/bot-server/src/server/routes/webhook.route.ts` uses timing-safe
  comparison for the Telegram secret when lengths match. It returns generic
  `Unauthorized` and `Bad Request` responses, but body-size and schema-depth
  protections are not enforced before JSON parsing.

### Dependencies

`pnpm audit --audit-level=moderate` currently fails with 7 findings:

| Severity | Package | Path |
| --- | --- | --- |
| Moderate | `uuid` | `packages__database > testcontainers > dockerode > uuid` |
| Moderate | `qs` | `packages__storage-engine > @googleapis/drive > googleapis-common > qs` |
| Moderate | `js-yaml` | `@changesets/cli` transitive paths |
| Moderate | `markdown-it` | `apps__docs > typedoc > markdown-it` |
| Moderate | `@opentelemetry/core` | `packages__sentry > @sentry/node > @opentelemetry/core` |
| Low | Transitive package | Included in the audit summary |

`pnpm audit --audit-level=high` passed before this work started, but Spec 057
requires runtime-reachable Moderate advisories to be remediated or explicitly
approved as non-exploitable.

### Runtime Image

- `apps/bot-server/Dockerfile` already uses a multi-stage build and a non-root
  `hono` user.
- The runner image copies `packages`, `modules`, `specs`, and bot-server
  locales. This keeps module validation working but does not satisfy the minimal
  runtime-artifact requirement.
- No runtime manifest is generated or validated yet.

### Workflows

- `.github/workflows/ci.yml` runs methodology, lint, typecheck, unit,
  integration, e2e, coverage, high-severity audit, and changeset checks.
- `.github/workflows/docker.yml` builds and pushes to GHCR on `main` and tags.
  It currently has `provenance: false` and no SBOM, image scan, signature,
  immutable digest promotion, staging smoke, or production promotion gate.
- `.github/workflows/docs-lint.yml` runs Vale on documentation pull requests.

### Tests

`pnpm test:inventory` passed and reported 36 test surfaces, 363 test files, and
zero testless surfaces.

## Execution Notes

- T001, T002, T004, and T005 are complete as documentation and baseline tasks.
- T003 remains open because no architecture decision has changed yet.
- T006 is complete: `deps.factory.test.ts` now proves `initI18n()` rejection is
  mapped to `bot-server.startup.i18n_init_failed` and that `loadModuleLocales()`
  `Result.err` during cache warming is not silently ignored.
- T007 is complete: existing database, Redis, and module-loading failure tests
  are joined by an HTTP listen failure-injection test in
  `startup-sequence.test.ts`.
- T008 remains open. `buildDeps()` now validates i18n initialization, but the
  full initializer refactor and readiness activation work are not complete.
