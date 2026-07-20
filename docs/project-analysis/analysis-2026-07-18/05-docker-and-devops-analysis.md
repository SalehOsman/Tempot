# 05 - Docker And DevOps Analysis

## Summary

Docker and CI/CD posture is strong compared with the rest of the project. The main deployment risk is not image construction; it is incomplete production evidence and unstable local integration/coverage commands.

## Positive Evidence

| Area | Evidence | Assessment |
|---|---|---|
| Dockerfile | `apps/bot-server/Dockerfile` | Multi-stage runtime image and non-root runtime posture. |
| Local compose | `docker-compose.yml` | Good local Postgres/Redis/bot-server setup; not a production deployment file. |
| CI workflow | `.github/workflows/ci.yml` | Broad methodology, lint, typecheck, unit, integration, coverage, audit, and docs gates. |
| Docker workflow | `.github/workflows/docker.yml` | Trivy high/critical scanning, SBOM/provenance, Cosign sign/verify. |
| Docs lint workflow | `.github/workflows/docs-lint.yml` | Vale-based docs linting for selected docs paths. |

## Problems

| ID | Problem | Severity | Evidence | Fix |
|---|---|---|---|---|
| DO-001 | Production go/no-go evidence remains incomplete. | Critical | `docs/ROADMAP.md:168-170`, `docs/ROADMAP.md:313-320`. | Complete staging smoke, monitoring, rollback, backup/restore evidence. |
| DO-002 | Integration command timed out locally. | High | `pnpm test:integration` timed out after 244 seconds. | Diagnose hang and stabilize Testcontainers lifecycle. |
| DO-003 | Coverage command timed out locally. | High | `pnpm test:coverage` timed out after 244 seconds. | Fix coverage execution and artifact generation. |
| DO-004 | Secret scanning was not confirmed in workflows. | High | Reviewed workflows do not show gitleaks/trufflehog-style scanning. | Add secret scanning for PRs and history/baseline. |
| DO-005 | Docs build warnings remain. | Medium | Prior `pnpm build` passed with Astro markdown config deprecation and Pagefind `docs -> 404` warning. | Clean warnings and add warning budget. |

## Production Readiness Answer

| Question | Answer |
|---|---|
| Can the project build? | Yes. |
| Can the bot runtime build? | Yes. |
| Are unit tests green? | Yes. |
| Is production approved now? | No. |
| Main blocker | Missing operational evidence and unreliable local integration/coverage gates. |

## Recommended DevOps Work

| Priority | Work |
|---|---|
| P0 | Finish external staging smoke and rollback rehearsal. |
| P0 | Restore deterministic integration test completion. |
| P1 | Restore deterministic coverage completion. |
| P1 | Add secret scanning CI. |
| P1 | Resolve pnpm policy warning. |
| P2 | Add docs build/link-check warning budgets. |

