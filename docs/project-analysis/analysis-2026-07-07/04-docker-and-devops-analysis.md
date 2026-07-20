# 04 - Docker and DevOps Analysis

## Current Remote Baseline

`origin/main` is green at commit `e07a832eb6bebb38ec98af0a248e0f3a158f4ec0`.

Latest confirmed GitHub Actions runs:

| Workflow | Run | Result | Commit |
| --- | --- | --- | --- |
| Docker | `27868802165` | Success | `e07a832...` |
| CI | `27868802178` | Success | `e07a832...` |

The latest known signed and verified image digest for the current `main` baseline is:

```text
sha256:769d1a616848944231fd64df16bc54980e5fe6d4497b9b79c5ea1c1822778d07
```

## Docker Readiness

Spec #057 already delivered major container and supply-chain improvements:

- Runtime manifest generation.
- Minimal runtime artifact copy policy.
- Non-root runner.
- Trivy scan gate.
- BuildKit SBOM/provenance.
- Cosign signing and verification.
- Docker workflow publication from `main`.

The remaining problem is operational evidence, not basic image construction.

## Open Spec #057 Delivery Gates

The following remain open:

- T032: image-content, scan, signature, and smoke tests green for the selected current digest in external staging.
- T033: migration compatibility and rollback/forward-fix checklist automation.
- T034: container staging smoke tests.
- T035: immutable digest promotion between build, staging, and production.
- T036: required runtime metrics.
- T037: independent alert fallback.
- T040: staging deployment and rollback/forward-fix rehearsal.
- T041-T049: final evidence reconciliation, scans, reviews, changesets, and go/no-go decision.

## Staging Recommendation

A staging smoke is acceptable only under these constraints:

1. Resolve the current digest from the latest successful Docker workflow on `main` immediately before deployment.
2. Deploy by immutable digest, not by mutable tag.
3. Use target staging secrets from a proper secret store.
4. Run migrations against an isolated PostgreSQL 16 + pgvector staging database.
5. Verify public `/live`, restricted `/ready`, Telegram webhook delivery, command response, logs, alerts, backup/restore, and rollback or forward-fix.
6. Record the evidence under `docs/operations/evidence/` and reconcile Spec #057 tasks.

## DevOps Risks

| Risk | Severity | Status |
| --- | --- | --- |
| Dirty local workspace used as deploy source | High | Must be prohibited. |
| External staging evidence missing | High | Open under Spec #057. |
| Immutable promotion not automated | High | Open under Spec #057. |
| Independent alert fallback missing | Medium/High | Open under Spec #057. |
| Local pnpm drift | Medium | Use Corepack/fix PATH before release gates. |

## Conclusion

Docker and CI foundations are strong enough for a controlled staging rehearsal. They are not enough for production approval until Spec #057 evidence gates are closed and independently reviewed.

