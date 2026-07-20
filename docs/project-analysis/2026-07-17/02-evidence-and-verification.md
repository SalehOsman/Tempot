# Evidence And Verification

## Evidence Sources

| Area | Files and paths reviewed |
|---|---|
| Governance | `AGENTS.md`, `.specify/memory/roles.md`, `.specify/memory/constitution.md` |
| Roadmap | `docs/ROADMAP.md` |
| Architecture | `docs/architecture/tempot_architecture.md` |
| Workflow | `docs/developer/workflow-guide.md`, `docs/developer/package-creation-checklist.md` |
| Prior analyses | `docs/project-analysis/2026-06-07/`, `docs/analysis-2026-06-10/`, `docs/analysis-2026-06-23/`, `docs/analysis-2026-07-07/`, `docs/code-review-2025-05-18/` |
| Runtime | `apps/bot-server/src/index.ts`, `apps/bot-server/src/startup/*`, `apps/bot-server/src/server/*` |
| Deployment | `apps/bot-server/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, `.github/workflows/docker.yml`, `.github/workflows/docs-lint.yml` |
| Config/security | `.env.example`, local `.env` presence only, dependency audit output |
| Tests | `vitest.config.ts`, unit/e2e/integration/coverage command results |

## Command Results

| Command | Result | Details |
|---|---|---|
| `pnpm methodology:lint --format=json` | Passed | Overall pass; allowlist total 28, no expired entries. |
| `pnpm spec:validate` | Passed | 366 of 366 checks passed. |
| `pnpm lint` | Passed | No lint failures. |
| `pnpm build` | Passed on rerun | Completed in about 208 seconds; docs build warnings remain. |
| `pnpm --filter bot-server... build` | Passed | Bot-server dependency build completed. |
| `pnpm build:bot-runtime` | Passed | Runtime packages and modules built. |
| `pnpm test:unit` | Passed | 363 files, 2584 tests passed. |
| `pnpm test:e2e` | Passed | 1 file, 13 tests passed. |
| `pnpm test:integration` | Timed out locally | Timed out after 244 seconds. |
| `pnpm test:coverage` | Timed out locally | Timed out after 244 seconds; no coverage summary generated. |
| `pnpm cms:check` | Passed | No CMS violations. |
| `pnpm boundary:audit` | Passed | 1096 TypeScript files checked; zero violations. |
| `pnpm authorization:check` | Passed | 9 modules checked; zero violations. |
| `pnpm module:checklist` | Passed | 9 modules checked; zero violations. |
| `pnpm source:conformance` | Passed | Zero findings. |
| `pnpm toolchain:audit` | Passed | Zero findings. |
| `pnpm docs:check` | Passed | Docs freshness, frontmatter, and claims checks passed. |
| `pnpm audit --audit-level=high` | Passed threshold | 2 vulnerabilities below threshold: 1 low, 1 moderate. |

## Repeated Toolchain Warning

Every pnpm command printed this warning:

```text
The "pnpm" field in package.json was found. This will not take effect. You should configure "pnpm" at the root of the workspace instead.
```

Technical meaning: dependency overrides and audit policy in `package.json#pnpm` cannot be treated as active unless moved to supported workspace configuration.

## Current Git Workspace Observation

The workspace already had unrelated untracked RAG fixture files before this report package was expanded:

| Path | Status |
|---|---|
| `apps/docs/tests/fixtures/` | Untracked, not touched by this review. |
| `apps/docs/tests/integration/rag-golden-fixture.test.ts` | Untracked, not touched by this review. |

The analysis package added files under `docs/project-analysis/2026-07-17/` only.

