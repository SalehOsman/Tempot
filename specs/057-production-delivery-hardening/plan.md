# Implementation Plan: Production Delivery Hardening

**Branch**: `codex/057-production-delivery-hardening` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

## Summary

Harden startup, Hono perimeter, health reporting, dependencies, container
contents, supply-chain evidence, deployment promotion, migration compatibility,
metrics, alerting, and rollback for the provider-neutral Tempot Core container
release path.

## Technical Context

**Language/Version**: TypeScript 5.9.3; Node.js 22.12+
**Primary Dependencies**: Hono 4.x patched release, grammY 1.41.x, Pino 9.x, Sentry, Docker BuildKit, GitHub Actions/GHCR
**Storage**: PostgreSQL 16, Redis, image registry, CI artifacts
**Testing**: Vitest, integration tests, container smoke tests, vulnerability scanning, signature verification, staging rehearsal
**Target Platform**: Linux OCI containers, provider-neutral self-hosted deployment
**Project Type**: Bot web service and monorepo release pipeline
**Performance Goals**: Preserve constitutional database/Redis/error/memory thresholds; cheap public liveness; bounded webhook bodies and rate limits
**Constraints**: Non-root runtime, immutable artifacts, no public diagnostics, no source/spec trees in runner, compatible migration strategy
**Scale/Scope**: One bot-server image, current dependencies, PostgreSQL/Redis, GHCR publishing

## Constitution Check

- **Rules XVII, LV-LVIII**: Graceful shutdown, health, monitoring, audit, and thresholds.
- **Rules XVIII, XXIX-XXXIII**: External abstractions, HTTP rate limiting, sanitization, Redis/AI degradation.
- **Rule XXI**: Startup/application fallible APIs preserve Result contracts.
- **Rule XXXI**: Secrets and protected data remain secure.
- **Rules XLIV-XLV**: Architectural/dependency decisions require review and ADR where patterns change.
- **Rule XLVII**: Security and external delivery details require `detailed-specs.md`.
- **Rules XXXIV-XXXVIII**: TDD and zero-defect gates.
- **Rules L/LIX-LXIII**: Deployment and operations documentation remain synchronized.
- **Rules LXXIX-LXXXVI**: SpecKit and Superpowers gates remain mandatory.

Initial gate result: PASS, subject to ADR review if health endpoints, runtime
manifest, or release signing introduce a new architectural pattern.

## Project Structure

```text
specs/057-production-delivery-hardening/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- detailed-specs.md
|-- quickstart.md
|-- contracts/
|   `-- production-release-contract.md
|-- checklists/
|   `-- production-readiness.md
`-- tasks.md

apps/bot-server/src/startup/
apps/bot-server/src/server/
apps/bot-server/Dockerfile
docker-compose.yml
.github/workflows/
packages/*/
docs/operations/
docs/security/
```

**Structure Decision**: Keep runtime health/security in bot-server, reusable
signals in existing packages, build-time manifest generation in tooling, and
artifact/promotion policy in GitHub Actions plus provider-neutral operations
documentation.

## Delivery Phases

1. Startup and health truthfulness.
2. HTTP perimeter and dependency remediation.
3. Minimal runtime manifest/image.
4. Supply-chain evidence.
5. Staging promotion, observability, and rollback rehearsal.

## TDD and Verification

- Failure injection before startup changes.
- HTTP adversarial tests before middleware changes.
- Image-content and non-root assertions before Dockerfile changes.
- Pipeline policy tests before publication changes.
- Staging rehearsal before production-ready status.

Required gates include focused tests, full test suites, docs, audit, image scan,
SBOM/signature verification, container smoke, migration/restore rehearsal,
lint, build, and spec validation.

## Post-Design Constitution Check

The design strengthens startup, security, health, degradation, observability,
dependency, documentation, and release requirements without selecting a
mandatory provider.

Post-design gate result: PASS.

## Complexity Tracking

No constitution exception is requested.
