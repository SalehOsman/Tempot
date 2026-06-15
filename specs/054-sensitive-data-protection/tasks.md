# Tasks: Sensitive Data Protection

**Input**: Design documents from `specs/054-sensitive-data-protection/`  
**Prerequisites**: All files in this spec, including `detailed-specs.md` and `contracts/protected-data-contract.md`  
**Tests**: Mandatory. Security behavior follows RED -> GREEN -> REFACTOR.

## Phase 1: Approval and Inventory

- [x] T001 Create execution worktree `codex/054-sensitive-data-protection` after Spec 053 reaches its approved execution checkpoint
- [x] T002 Inventory protected schema fields, repository mappings, lookup paths, audit snapshots, logger paths, Sentry paths, and backups in `docs/security/data-classification.md`
- [x] T003 [P] Profile nulls, duplicates, normalization conflicts, and audit exposure with a non-destructive script under `scripts/security/`
- [x] T004 [P] Create the encryption/key-management ADR in `docs/architecture/adr/` and update `docs/architecture/adr/README.md`
- [x] T005 Create the key-management and migration runbooks in `docs/operations/`
- [x] T006 Obtain Project Manager approval for classification, ADR, irreversible checkpoint, and runbooks

## Phase 2: Foundational RED Tests and Contracts

- [x] T007 [P] Create failing AES envelope and tamper tests under `packages/database/tests/unit/`
- [x] T008 [P] Create failing lookup normalization/token tests under `packages/database/tests/unit/`
- [x] T009 [P] Write failing key-ring and rotation tests in `packages/settings/tests/` and database protection tests
- [x] T010 [P] Write failing repository plaintext/canary tests in `modules/user-management/tests/integration/`
- [x] T011 [P] Write failing audit allowlist tests in `packages/database/tests/`
- [x] T012 [P] Write failing Pino and Sentry canary-redaction tests in their package test directories
- [x] T013 [P] Write failing resumable migration and rollback tests using Testcontainers

**Checkpoint**: Tests prove current plaintext, audit, and observability exposure.

## Phase 3: User Story 1 - Protect New Writes (P1)

- [x] T014 [US1] Define strict protection, key-provider, payload, and lookup-token types in `packages/database/src/`
- [x] T015 [US1] Implement Node crypto protection behind the typed Result-based interface
- [x] T016 [US1] Add validated versioned key settings in `packages/settings/src/`
- [x] T017 [US1] Add expand-only Prisma schema and migration changes in `packages/database/prisma/`
- [x] T018 [US1] Update user repository mapping to write protected payloads and lookup tokens atomically
- [x] T019 [US1] Update approved exact-match lookups to use tokens
- [x] T020 [US1] Run T007-T010 and confirm GREEN without plaintext fallback

**Independent Test**: New user writes and exact lookups work while canary plaintext is absent from persisted rows.

## Phase 4: User Story 4 - Protect Audit and Observability (P1)

- [x] T021 [US4] Replace whole-entity audit snapshots with an explicit safe-field policy in `packages/database/src/base/`
- [x] T022 [US4] Expand Pino redaction and serializers in `packages/logger/src/`
- [x] T023 [US4] Expand Sentry `beforeSend` protection in `packages/sentry/src/`
- [x] T024 [US4] Remove protected values from error details and administrative diagnostics in affected consumers
- [x] T025 [US4] Run T011-T012 canary tests and confirm GREEN across audit, logs, Sentry, and errors

**Independent Test**: Known canary values traverse success and failure paths without appearing in observability sinks.

## Phase 5: User Story 2 - Migrate Existing Data (P1)

- [x] T026 [US2] Implement dry-run inventory and conflict reporting in `scripts/security/`
- [x] T027 [US2] Implement resumable bounded user backfill with non-sensitive checkpoints
- [x] T028 [US2] Implement structured historical audit sanitation with irreversible markers
- [x] T029 [US2] Implement verification for row counts, logical recovery, lookup parity, and canary absence
- [x] T030 [US2] Add cutover controls that block protected reads on any verification failure
- [x] T031 [US2] Execute interruption/resume and backup/restore rehearsals in an isolated database
- [x] T032 [US2] Obtain approval before applying the plaintext-retirement migration (approved 2026-06-16; production application remains gated)

**Independent Test**: Seeded legacy data migrates, resumes, verifies, and restores without plaintext leakage or loss.

## Phase 6: User Story 3 - Key Rotation (P1)

- [x] T033 [US3] Implement active/readable/retiring key lifecycle in the provider boundary
- [x] T034 [US3] Implement bounded re-protection under the active key version
- [x] T035 [US3] Add verification that blocks key retirement while any target record needs the old key
- [x] T036 [US3] Execute a two-version rotation rehearsal and confirm old-key retirement readiness

**Independent Test**: Old and new records remain readable during rotation and the old key becomes unnecessary after verified re-protection.

## Phase 7: Documentation, Review, and Release Gates

- [x] T037 Update security, architecture, deployment, backup, configuration, and user-management documentation
- [x] T038 Update all SpecKit artifacts and `docs/ROADMAP.md` with actual migration status
- [x] T039 Run focused tests and full relevant unit/integration suites
- [x] T040 Run database migration dry run, audit sanitation dry run, canary scan, backup restore, and key rotation rehearsal
- [x] T041 Run `pnpm lint`, `pnpm build`, `pnpm audit --audit-level=high`, and `pnpm spec:validate`
- [x] T042 Request independent security/code review and resolve all Critical/High findings
- [x] T043 Run `speckit-analyze` and resolve artifact inconsistencies
- [x] T044 Create changesets for all released packages affected
- [ ] T045 Run verification-before-completion; explicit retirement approval was recorded on 2026-06-16
- [x] T046 Add and execute the approved protected-data p95 regression benchmark
- [x] T047 Clear stale lookup metadata and support exact lookup across readable key versions without broad decryption
- [x] T048 Prevent concurrent backfill overwrite and detect conflicts across plaintext and protected identities
- [x] T049 Enforce explicit audit allowlists, preserve validated change metadata, and redact logger payloads recursively
- [x] T050 Fail startup on malformed or partial protected-key configuration
- [x] T051 Return typed non-sensitive errors from migration and rotation database failure paths
- [x] T052 Stabilize the 20 percent p95 gate with equivalent writes and median interleaved trials
- [x] T053 Repeat backup/restore with an explicitly encrypted local artifact and correct operational evidence
- [ ] T054 Repeat independent security/code review and resolve all remaining Critical/High findings
- [x] T055 Canonicalize national-ID comparison and rotation-token generation across equivalent formats
- [x] T056 Reject stale concurrent backfill writes with a typed non-sensitive error
- [x] T057 Regenerate incomplete lookup metadata and block premature key retirement
- [x] T058 Avoid requiring decryption capability for non-protected field updates
- [x] T059 Fail bot-server startup for every invalid static-settings result
- [x] T060 Enforce audit allowlisting at the public logger boundary and suppress unchanged protected-field markers

## Dependencies and Execution Order

- T002-T006 block implementation.
- T007-T013 must be RED before T014.
- New-write protection and observability protection precede legacy migration.
- Migration verification precedes plaintext retirement.
- Rotation rehearsal precedes production readiness approval.
- No destructive migration proceeds after any failed gate.

## MVP Scope

The minimum release-blocking scope is T001-T025: stop new plaintext writes and
observability leakage. Production remains blocked until migration and rotation
phases are also complete.

## Requirements Traceability

- `FR-001`, `FR-017`, `FR-018`, `FR-019`: T002-T003, T010, T026, T031, T047-T048
- `FR-002`, `FR-003`, `FR-004`, `FR-009`, `FR-016`: T007-T010, T014-T020, T047-T048
- `FR-005`, `FR-006`, `FR-007`, `FR-008`: T004-T009, T014-T016, T033-T036, T047, T050-T051
- `FR-010`, `FR-011`: T011, T021, T028, T049
- `FR-012`, `FR-015`, `FR-020`: T012, T022-T025, T029-T031, T049, T051
- `FR-013`, `FR-014`: T005, T013, T026-T032, T040, T048, T051, T053
- `FR-021`: T005, T031, T037, T040, T053
- `FR-022`: T004-T006, T037, T042, T045
- `SC-001`: T010-T012, T020, T025, T029, T040, T047, T049
- `SC-002`, `SC-003`, `SC-004`, `SC-005`: T026-T032, T040, T047-T049, T051
- `SC-006`: T033-T036, T040, T047, T051
- `SC-007`: T042, T045, T054
- `SC-008`: T039-T045, T050-T054
- `SC-009`: T046, T052
