# 11 - Fix Plan

## Execution Order

### Phase 1 - Stop The Release Blockers

| Order | Task | Priority | Owner profile | Verification |
|---:|---|---|---|---|
| 1 | Complete external staging webhook/container smoke. | P0 | DevSecOps | Dated smoke evidence linked from roadmap. |
| 2 | Complete monitoring/alert evidence. | P0 | DevSecOps | Alert proof and runbook evidence. |
| 3 | Complete rollback rehearsal. | P0 | DevSecOps + Backend | Rollback record with commands and result. |
| 4 | Complete backup/restore and protected-data evidence. | P0 | Backend + DevSecOps | Restore proof and key-rotation result. |
| 5 | Diagnose `pnpm test:integration` timeout. | P0 | QA/Test Lead | Command completes locally and in CI. |

### Phase 2 - Fix RAG Documentation Correctness

| Order | Task | Priority | Owner profile | Verification |
|---:|---|---|---|---|
| 1 | Add RAG corpus manifest or metadata classifier. | P1 | Architect + Backend | Corpus report shows no unapproved `unknown` language docs. |
| 2 | Add strict docs ingestion mode for chunk failures. | P1 | Backend | Test proves hash is not saved after partial chunk failure. |
| 3 | Promote golden RAG fixture into tracked test assets or remove it intentionally. | P1 | QA/Test Lead | CI includes the test or workspace is clean. |
| 4 | Add RAG retrieval ranking policy for generated reference docs. | P1 | Architect | Tests prove source-of-truth docs outrank API reference for general questions. |
| 5 | Add stale/archive exclusion for historical analysis docs. | P2 | Docs + AI | RAG manifest excludes stale docs unless explicitly requested. |

### Phase 3 - Restore Governance Clarity

| Order | Task | Priority | Owner profile | Verification |
|---:|---|---|---|---|
| 1 | Resolve historical docs path drift and allowlist mismatch. | P1 | Technical Advisor | `pnpm methodology:lint --format=json` passes. |
| 2 | Rewrite active architecture doc in English UTF-8. | P1 | Senior Architect | No architecture-doc language allowlist needed. |
| 3 | Burn down remaining methodology allowlist entries. | P1 | Code Reviewer | Allowlist count decreases and broad globs are removed. |
| 4 | Move pnpm policy to supported workspace config. | P1 | DevSecOps | pnpm warning disappears. |

### Phase 4 - Security And Operations Hardening

| Order | Task | Priority | Owner profile | Verification |
|---:|---|---|---|---|
| 1 | Remove webhook fallback secret. | P1 | Backend | Tests prove missing secret fails outside local test mode. |
| 2 | Add secret scanning CI. | P1 | DevSecOps | PRs fail on seeded secret fixture and pass placeholders. |
| 3 | Harden request-size enforcement. | P2 | Backend | No-content-length oversized request test passes. |
| 4 | Validate trusted proxy headers. | P2 | Backend + DevSecOps | Missing header scenario is detected in production mode. |

## Immediate First Sprint

| Day | Focus |
|---:|---|
| 1 | Reproduce and isolate integration timeout. |
| 2 | Fix integration timeout and start coverage timeout investigation. |
| 3 | Fix pnpm policy warning and webhook fallback secret. |
| 4 | Add RAG metadata/corpus report and partial-ingestion failing test. |
| 5 | Fix strict ingestion behavior and update docs/RAG plan. |

## Definition Of Done

| Gate | Required result |
|---|---|
| Release | Production evidence complete and linked. |
| QA | Integration and coverage commands complete. |
| RAG | Corpus metadata validated and partial chunk failures cannot be silently skipped. |
| Governance | Methodology lint passes without stale path mismatch. |
| Security | Secret scanning active and webhook fallback secret removed. |

