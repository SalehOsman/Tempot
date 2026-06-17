# Tasks: Production Delivery Hardening

**Input**: Design documents from `specs/057-production-delivery-hardening/`
**Tests**: Mandatory for runtime, HTTP, image, pipeline, and deployment behavior.

## Phase 1: Setup and Threat/Release Baseline

- [x] T001 Create execution worktree `codex/057-production-delivery-hardening`
- [x] T002 Record startup stages, health visibility, HTTP routes, dependency advisories, image contents, and workflow baseline
- [ ] T003 [P] Create or update the HTTP/health/runtime-manifest ADR and ADR index if architectural decisions change
- [x] T004 [P] Create a production threat model in `docs/security/`
- [x] T005 Define migration compatibility and release evidence templates in `docs/operations/`

## Phase 2: User Story 1 - Predictable Startup (P1)

- [x] T006 [P] [US1] Write failing i18n rejection and ignored-result startup tests in `apps/bot-server/tests/`
- [x] T007 [P] [US1] Write failing database, Redis, module-loading, and server-start failure-injection tests
- [ ] T008 [US1] Refactor `apps/bot-server/src/startup/deps.factory.ts` to validate every initializer and map failures to Result/AppError
- [ ] T009 [US1] Add explicit startup-stage state and readiness activation
- [ ] T010 [US1] Reconcile optional dependency degradation and required-provider configuration
- [ ] T011 [US1] Verify one-time logging and graceful shutdown for each failure

**Independent Test**: Every mandatory failure blocks readiness and traffic.

## Phase 3: User Story 2 - Secure HTTP Perimeter (P1)

- [ ] T012 [P] [US2] Write failing public-liveness disclosure and restricted-readiness tests
- [ ] T013 [P] [US2] Write failing secure-header, body-limit, rate-limit, CORS, malformed-body, and safe-error tests
- [ ] T014 [US2] Split or refactor health routes into minimal public liveness and restricted readiness
- [ ] T015 [US2] Add Hono security middleware in `apps/bot-server/src/server/hono.factory.ts`
- [ ] T016 [US2] Preserve timing-safe webhook secret validation and strengthen request schema validation
- [ ] T017 [US2] Make health probes report required/unconfigured/degraded states accurately
- [ ] T018 [US2] Make thresholds configurable and align defaults with the constitution
- [ ] T019 [US2] Implement and verify explicit Redis-outage rate-limit fallback or controlled denial, then confirm the adversarial HTTP/runtime suite GREEN

**Independent Test**: Public HTTP exposes minimal information and rejects abusive input before bot processing.

## Phase 4: Runtime Dependency Remediation (P1)

- [ ] T020 [P] Upgrade Hono to a patched release covering the confirmed audit advisories
- [ ] T021 [P] Upgrade or override confirmed `qs`, `uuid`, and `@ai-sdk/provider-utils` advisory paths
- [ ] T022 Run focused regression tests for every upgraded runtime dependency path
- [ ] T023 Run dependency audit and document any time-bounded approved exception

## Phase 5: User Story 3 - Minimal Verifiable Artifact (P1)

- [ ] T024 [P] [US3] Write failing image-content assertions for source, tests, and `specs/` trees
- [ ] T025 [P] [US3] Write failing runtime-manifest validation and non-root smoke tests
- [ ] T026 [US3] Generate a build-time validated runtime module manifest
- [ ] T027 [US3] Update module discovery/validation to consume the runtime manifest
- [ ] T028 [US3] Refactor `apps/bot-server/Dockerfile` to copy compiled runtime artifacts only
- [ ] T029 [US3] Pin base-image policy and preserve non-root execution
- [ ] T030 [US3] Add SBOM, image scan, provenance, signing, and verification to `.github/workflows/docker.yml`
- [ ] T031 [US3] Block publication/promotion on policy failures
- [ ] T032 [US3] Confirm image-content, scan, signature, and smoke tests GREEN

**Independent Test**: The signed immutable image is minimal, non-root, scanned, and reproducible.

## Phase 6: User Story 4 - Observable Reversible Deployment (P1)

- [ ] T033 [P] [US4] Add migration compatibility and rollback/forward-fix checklist automation
- [ ] T034 [P] [US4] Add container staging smoke tests for migrations, liveness/readiness, webhook, and shutdown
- [ ] T035 [US4] Implement immutable digest promotion between build, staging, and production workflow stages
- [ ] T036 [US4] Add required runtime metrics through existing observability abstractions
- [ ] T037 [US4] Add independent alert fallback configuration and failure tests
- [ ] T038 [US4] Harden `docker-compose.yml` as explicit local-only infrastructure with safe bindings
- [ ] T039 [US4] Update production deployment, backup/restore, migration, incident, and rollback runbooks
- [ ] T040 [US4] Execute staging deployment and rollback/forward-fix rehearsal

**Independent Test**: The same digest is promoted and a simulated failed release is recovered safely with observable evidence.

## Phase 7: Review and Production Gate

- [ ] T041 Update all SpecKit artifacts and `docs/ROADMAP.md` with actual evidence
- [ ] T042 Run focused and full test suites, lint, build, docs, boundary, CMS, and module gates
- [ ] T043 Run dependency and image scans with zero unapproved findings
- [ ] T044 Verify SBOM, provenance, signature, digest promotion, and runtime contents
- [ ] T045 Verify backup/restore, migration compatibility, staging smoke, metrics, alerts, and rollback/forward-fix
- [ ] T046 Request security, architecture, DevSecOps, QA, and code review and resolve all Critical/High findings
- [ ] T047 Run `speckit-analyze` and `pnpm spec:validate`
- [ ] T048 Create required changesets
- [ ] T049 Run verification-before-completion and record the production go/no-go decision

## Dependencies and Execution Order

- Startup truthfulness precedes readiness exposure.
- HTTP tests precede perimeter implementation.
- Dependency remediation precedes image promotion.
- Runtime manifest precedes runner image reduction.
- Artifact evidence precedes staging.
- Staging and recovery rehearsal precede production approval.

## MVP Scope

US1 and US2 provide a safer staging runtime. Production approval additionally
requires US3, US4, and the full final gate.

## Requirements Traceability

- `FR-001`, `FR-002`, `FR-003`, `FR-004`: T006-T011
- `FR-005`, `FR-006`, `FR-007`, `FR-008`, `FR-009`, `FR-010`, `FR-011`: T012-T019
- `FR-012`, `FR-013`: T020-T023, T043
- `FR-014`, `FR-015`: T024-T029, T032
- `FR-016`, `FR-017`: T030-T032, T035, T044
- `FR-018`, `FR-019`: T038-T039
- `FR-020`, `FR-021`, `FR-022`: T005, T033-T035, T039-T040, T045
- `FR-023`, `FR-024`, `FR-025`, `FR-026`: T009-T010, T017-T018, T036-T037, T045
- `FR-027`: T039-T040, T045
- `FR-028`: T043, T046, T049
- `FR-029`: T013, T015, T019, T036-T037
- `SC-001`: T006-T011
- `SC-002`, `SC-003`: T012-T019
- `SC-004`: T020-T023, T043
- `SC-005`, `SC-006`: T024-T032, T044
- `SC-007`: T033-T040, T045
- `SC-008`, `SC-009`: T036-T037, T040, T045
- `SC-010`: T046, T049
- `SC-011`: T019, T036-T037, T045
