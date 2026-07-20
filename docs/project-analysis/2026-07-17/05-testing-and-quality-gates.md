# Testing And Quality Gates

## Current Test Results

| Gate | Result | Confidence |
|---|---|---|
| `pnpm lint` | Passed | High |
| `pnpm build` | Passed on rerun | High for build, medium for duration/warnings |
| `pnpm build:bot-runtime` | Passed | High |
| `pnpm test:unit` | Passed, 363 files and 2584 tests | High |
| `pnpm test:e2e` | Passed, 1 file and 13 tests | Medium |
| `pnpm test:integration` | Timed out locally | Low until fixed |
| `pnpm test:coverage` | Timed out locally | Low until fixed |
| `pnpm spec:validate` | Passed, 366 of 366 checks | High |
| `pnpm docs:check` | Passed | High |
| `pnpm boundary:audit` | Passed | High |
| `pnpm authorization:check` | Passed | High |
| `pnpm module:checklist` | Passed | High |

## Key Testing Problems

| Problem | Severity | Evidence | Fix |
|---|---|---|---|
| Integration command times out. | High | `pnpm test:integration` timed out after 244 seconds. | Identify hanging suite, add per-test timeout, clean Testcontainers lifecycle. |
| Coverage command times out. | High | `pnpm test:coverage` timed out and no summary was produced. | Fix coverage execution and publish summary artifact. |
| E2E scope is narrow. | Medium | Only 1 e2e file and 13 tests passed. | Add smoke tests for production-critical startup, webhook, health, and rollback flows. |
| AI/RAG safety evidence remains incomplete. | Medium | Roadmap still lists fixture-backed leakage/no-context tests and module activation requirements. | Complete safety fixture tests before active runtime AI claims. |

## Test Plan

### Critical Tests

| Test | Purpose |
|---|---|
| External staging webhook smoke | Prove signed image and webhook flow in staging. |
| Migration and rollback rehearsal | Prove database release safety. |
| Protected-data key rotation | Prove encrypted user data remains usable after rotation. |
| Integration hang regression | Prevent future integration timeout regressions. |

### High Priority Tests

| Test | Purpose |
|---|---|
| Webhook manager env validation | Ensure weak fallback secret cannot be used. |
| Request body limit | Ensure oversized/no-length requests are rejected safely. |
| Trusted proxy/rate-limit | Ensure missing proxy headers are detected. |
| Coverage completion | Ensure coverage report is generated consistently. |

### Smoke Tests

| Test | Purpose |
|---|---|
| `/live` route | Liveness proof. |
| `/health` route | Basic health proof. |
| `/ready` route | Token-protected readiness proof. |
| Docker image start | Runtime image startup proof. |
| Bot runtime composition | Module manifest/runtime wiring proof. |

## Definition Of Done For Testing Stabilization

| Criterion |
|---|
| `pnpm test:integration` completes locally and in CI within a defined budget. |
| `pnpm test:coverage` produces a coverage summary artifact. |
| Staging smoke evidence exists for the signed image. |
| Production-critical failure paths have deterministic regression tests. |

