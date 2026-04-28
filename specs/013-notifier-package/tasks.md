# Tasks: Notifier Package

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`
**Prerequisites**: Package checklist, TDD, current Tempot CI gates

## Phase 1: Reactivation and Package Foundation

- [x] T001 Update `docs/archive/ROADMAP.md` to mark `notifier` active. (FR-011)
- [x] T002 Replace historical `packages/notifier/README.md` with current API and integration guidance. (FR-001, FR-003, FR-011)
- [x] T003 Create `packages/notifier/.gitignore`. (FR-012)
- [x] T004 Create `packages/notifier/package.json`. (FR-012)
- [x] T005 Create `packages/notifier/tsconfig.json`. (FR-012)
- [x] T006 Create `packages/notifier/vitest.config.ts`. (FR-012)

## Phase 2: Contracts

- [x] T007 Write failing unit tests for rate policy behavior. (FR-007, SC-002)
- [x] T008 Implement `src/notifier.errors.ts`. (FR-002)
- [x] T009 Implement `src/notifier.types.ts`. (FR-001, FR-003)
- [x] T010 Implement `src/notifier.ports.ts`. (FR-006)
- [x] T011 Implement `src/notification.rate-policy.ts`. (FR-007, SC-002)
- [x] T012 Export contracts from `src/index.ts`. (FR-001, FR-006)

## Phase 3: Queue Producer

- [x] T013 Write failing unit tests for queue enqueue success and failure. (FR-004, SC-001)
- [x] T014 Implement `src/notification.queue.ts`. (FR-004)
- [x] T015 Write failing unit tests for `sendToUser`, `sendToUsers`, `sendToRole`, `broadcast`, and `schedule`. (FR-001, FR-003, FR-008, SC-001, SC-003)
- [x] T016 Implement `src/notification.service.ts`. (FR-001, FR-003, FR-006, FR-007, FR-008, FR-010, SC-001, SC-002, SC-003)

## Phase 4: Delivery Processor

- [x] T017 Write failing unit tests for successful processing. (FR-009, FR-010, SC-004)
- [x] T018 Write failing unit tests for template render failure. (FR-003, FR-009, SC-004)
- [x] T019 Write failing unit tests for blocked user delivery. (FR-005, FR-009, FR-010, SC-005)
- [x] T020 Implement `src/notification.processor.ts`. (FR-009, FR-010, SC-004, SC-005)
- [x] T021 Write failing unit tests for Telegram adapter mapping. (FR-005)
- [x] T022 Implement `src/telegram.delivery.adapter.ts`. (FR-005)

## Phase 5: Worker Factory

- [x] T023 Write failing unit tests for worker limiter configuration where practical. (FR-007)
- [x] T024 Implement `src/notification.worker.ts`. (FR-007)
- [x] T025 Ensure worker errors rethrow after processor failure so BullMQ retry works. (FR-010, SC-006)

## Phase 6: Verification

- [x] T026 Run `pnpm install --frozen-lockfile`. (FR-012)
- [x] T027 Run `pnpm --filter @tempot/notifier test`. (SC-001, SC-002, SC-003, SC-004, SC-005, SC-006)
- [x] T028 Run `pnpm --filter @tempot/notifier build`. (FR-012)
- [x] T029 Run `pnpm spec:validate`. (FR-012)
- [x] T030 Run `pnpm cms:check`. (FR-003)
- [x] T031 Run `pnpm lint`. (FR-012)
- [x] T032 Run `pnpm boundary:audit`. (FR-006)
- [x] T033 Run `pnpm module:checklist`. (FR-012)
- [x] T034 Run `git diff --check`. (FR-012)
- [x] T035 Run `pnpm build`. (FR-012, SC-006)
- [x] T036 Run `pnpm test:unit`. (SC-001, SC-002, SC-003, SC-004, SC-005, SC-006)
- [x] T037 Run `pnpm test:integration`. (SC-006)
