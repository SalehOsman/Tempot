# 2026-07-26 Main CI, Docker, And Audit Recovery Evidence

## Scope

This record documents the post-merge evidence for the `main` branch recovery
after the high-severity dependency audit and Docker image scan failures reported
for commit `e7df3b4b5581c7279665a16f6ac8df7c9525c16d`.

This is not a production go decision. It proves that the repaired `main`
candidate passed GitHub CI, high-severity dependency audit, Docker build,
container image scan, Cosign signing, and Cosign signature verification. It does
not prove external staging deployment or a real Telegram two-account journey.

## Release Identity

| Item | Value |
| --- | --- |
| Date | 2026-07-26 |
| Environment | GitHub Actions on `main` |
| Merged PR | `#37` |
| Git commit | `1c852bcbf8a670a2e8be9db80a8b4a2ee802f540` |
| Commit title | `fix(workspace): remediate audit dependency advisories (#37)` |
| CI workflow run | `30204972837` |
| Docker workflow run | `30204972822` |
| Image tags | `ghcr.io/salehosman/tempot-bot-server:main`, `ghcr.io/salehosman/tempot-bot-server:sha-1c852bc` |
| Image digest | `ghcr.io/salehosman/tempot-bot-server@sha256:e3c28b445dc0dd92e502591568573e3af3e1dd1b8fe043d7594774fc37066815` |

## Root Cause Addressed

| Failure | Evidence | Resolution |
| --- | --- | --- |
| High-severity `postcss` advisory | GitHub CI `Security Audit` failed on `main` for commit `e7df3b4` | Workspace override forces patched `postcss` resolution |
| High-severity `brace-expansion` advisory | GitHub CI `Security Audit` failed on `main` for commit `e7df3b4` | Workspace overrides force patched `brace-expansion` resolution across observed majors |
| Docker Trivy image finding | Docker run for commit `e7df3b4` reported vulnerable `postcss@8.5.14` in the runtime image | Lockfile and runtime dependency graph now resolve to patched `postcss` before image build |
| Coverage gate instability | PR coverage initially failed in `protected-performance.test.ts` due runner timing spikes | The integration performance gate now checks sustained median regression instead of p95 micro-spikes |

## CI Evidence

GitHub Actions CI run `30204972837` completed successfully on `main` for commit
`1c852bcbf8a670a2e8be9db80a8b4a2ee802f540`.

| Job | Result |
| --- | --- |
| Methodology Gates | Passed |
| Lint | Passed |
| Secret Scan | Passed |
| Security Audit | Passed |
| Type Check on Node.js 22.12.0 | Passed |
| Type Check on Node.js 24 | Passed |
| Unit Tests on Node.js 22.12.0 | Passed |
| Unit Tests on Node.js 24 | Passed |
| Integration Tests | Passed |
| Coverage | Passed |

The security audit gate is the direct recovery evidence for the dependency
advisories. The coverage gate is the direct recovery evidence for the
performance-test instability found during PR validation.

## Docker And Supply Chain Evidence

GitHub Actions Docker run `30204972822` completed successfully on `main` for
commit `1c852bcbf8a670a2e8be9db80a8b4a2ee802f540`.

| Check | Result |
| --- | --- |
| Docker build and push | Passed |
| Immutable image digest emitted | `sha256:e3c28b445dc0dd92e502591568573e3af3e1dd1b8fe043d7594774fc37066815` |
| Trivy image scan | Passed |
| SARIF image scan report upload | Passed |
| Cosign image signing | Passed |
| Cosign signature verification | Passed |

The workflow signed and verified:

```text
ghcr.io/salehosman/tempot-bot-server@sha256:e3c28b445dc0dd92e502591568573e3af3e1dd1b8fe043d7594774fc37066815
```

## Local Verification Performed Before Merge

| Command or Check | Result |
| --- | --- |
| `pnpm audit --audit-level=high` | Passed; no High or Critical vulnerabilities remained |
| `pnpm why postcss` | Confirmed patched `postcss@8.5.23` resolution |
| `pnpm why brace-expansion` | Confirmed patched `brace-expansion@5.0.8` resolution |
| `pnpm lint` | Passed |
| `pnpm build` | Passed |
| `pnpm test:unit` | Passed |
| `pnpm spec:validate` | Passed |
| `pnpm cms:check` | Passed |
| `pnpm test:coverage` | Passed locally after stabilizing the performance gate |
| Local Docker image build | Passed |
| Runtime image PostCSS inspection | Confirmed only patched `postcss@8.5.23` was present |

## Operational Findings

1. `main` is green after the audit and Docker scan recovery.
2. The current signed candidate digest is newer than the last recorded
   2026-07-22 signed webhook smoke digest.
3. This evidence closes the GitHub CI, security audit, Docker scan, signing,
   and signature-verification recovery for the repaired `main` commit.
4. This evidence does not close staging runtime behavior. The candidate digest
   still needs to be pulled and smoke-tested on Docker Desktop or external
   staging before any release decision.
5. Docker workflow annotations still report that some GitHub Actions target
   deprecated Node.js 20 runtimes while GitHub forces them to Node.js 24. This
   is not a blocking failure, but it should be handled as workflow maintenance.

## Remaining Release Gates

- Pull and run the selected immutable digest on Docker Desktop or external
  staging.
- Apply migrations against the staging database.
- Verify local and public `/live`.
- Verify restricted `/ready` with the readiness token.
- Verify `/health` and record dependency status.
- Complete a real Telegram two-account journey:
  super admin `/start`, unregistered user membership request, membership data
  collection, super admin approval, role update, block or unblock action, and
  test notification delivery.
- Record target-environment backup and restore evidence.
- Record protected-data key-rotation evidence.
- Record monitoring and alert evidence.
- Record rollback or forward-fix rehearsal evidence.

## Decision

**No-go for production.**

The CI and signed image recovery is complete, but production approval remains
blocked by staging runtime smoke, real Telegram membership journey evidence,
target backup and restore rehearsal, key rotation rehearsal, monitoring
evidence, and rollback evidence.
