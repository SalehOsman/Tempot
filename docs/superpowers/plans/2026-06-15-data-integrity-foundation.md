# Data Integrity Foundation Implementation Plan

> **Execution rule:** Implement each behavioral slice with RED, GREEN, focused
> regression verification, review, and a scoped commit.

**Goal:** Implement the pre-Spec-054 foundation of Spec 055: atomic
national-ID-derived identity state and non-overridable normal soft-delete
reads.

**Base branch:** `codex/remediation-sequence-reconciliation` at `c24907b`  
**Execution branch:** `codex/055-data-integrity-hardening`

## Task 1: Establish the Execution Baseline

- [x] Create the isolated worktree and branch.
- [x] Activate Spec 055 in `.specify/feature.json`.
- [x] Record shared database blast radius.
- [x] Record direct Prisma access and pagination defects.
- [x] Run documentation and spec validation, then commit the baseline.

## Task 2: Atomic Identity State

- [ ] Add service-contract RED tests proving one repository operation owns all
      derived fields.
- [ ] Add repository integration coverage for complete successful persistence.
- [ ] Add a typed identity-update contract and repository operation.
- [ ] Replace `Promise.all` update coordination in both service paths.
- [ ] Run focused user-management and database tests.
- [ ] Review and commit the atomic-state slice.

The protected audit transaction remains open as T009 until Spec 054 integration
is available. The foundation must not claim full US1 completion.

## Task 3: Non-Overridable Normal Soft Delete

- [ ] Add RED tests for flat, nested, and direct Prisma conflicting filters.
- [ ] Apply the protected soft-delete scope after caller criteria.
- [ ] Remove normal runtime access to caller-controlled deletion fields where
      the owning public types permit a scoped correction.
- [ ] Run database integration and shared-consumer regression tests.
- [ ] Review and commit the normal-read soft-delete slice.

Privileged recovery remains open as T013/T016 until the authorization and
protected-audit contract is ready.

## Task 4: Foundation Verification

- [ ] Run lint, build, focused unit/integration tests, boundary audit, and spec
      validation.
- [ ] Update Spec 055 task evidence and roadmap status.
- [ ] Record remaining post-Spec-054 work without marking the feature complete.
