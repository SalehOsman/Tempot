# Bot Management Module - Tasks

**Feature:** 040-bot-management
**Source:** spec.md + plan.md + data-model.md + research.md
**Generated:** 2026-05-12

---

## Phase 1: Setup

**Purpose**: Establish the module shell and SpecKit traceability.

- [x] T001 Create `modules/bot-management/package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `index.ts`, and `README.md`. FR-001 SC-010
- [x] T002 Create `modules/bot-management/module.config.ts` and `modules/bot-management/module.manifest.ts` with selected blueprints and capability declarations. FR-001 FR-018 SC-006 SC-010
- [x] T003 Create `modules/bot-management/locales/ar.json` and `modules/bot-management/locales/en.json` with parity for all planned menu, error, and status keys. FR-018 SC-003 SC-006
- [x] T004 Create initial Starlight module documentation placeholder in `docs/product/modules/bot-management.md`. FR-001 SC-010

---

## Phase 2: Foundational Contracts

**Purpose**: Define stable types, schemas, events, permissions, and lifecycle rules before services.

- [x] T005 [P] Create bot domain types in `modules/bot-management/types/bot.types.ts`, `lifecycle.types.ts`, `settings.types.ts`, `module-enablement.types.ts`, `import-export.types.ts`, and `navigation.types.ts`. FR-001 FR-002 FR-006 FR-007 FR-014 FR-015 FR-021
- [x] T006 [P] Create validation schemas in `modules/bot-management/contracts/bot-profile.schema.ts`, `settings-profile.schema.ts`, `module-enablement.schema.ts`, and `import-export.schema.ts`. FR-001 FR-006 FR-007 FR-014 FR-015 FR-016
- [x] T007 Create lifecycle transition contract in `modules/bot-management/contracts/lifecycle-transitions.ts` with all valid transitions and reason requirements. FR-002 FR-003 FR-004 SC-002
- [x] T008 [P] Create event contracts in `modules/bot-management/events/event-names.ts` and `event-payloads.ts`. FR-005 FR-019 SC-007
- [x] T009 Create `modules/bot-management/abilities.ts` with GUEST, USER, ADMIN, and SUPER_ADMIN permissions. FR-017
- [x] T010 [P] Add unit tests for schemas, lifecycle transitions, event payload types, and abilities under `modules/bot-management/tests/unit/`. FR-002 FR-003 FR-004 FR-016 FR-017 FR-019 SC-002 SC-003

---

## Phase 3: Persistence

**Purpose**: Add module-owned persistence through repositories.

- [x] T011 Create `modules/bot-management/database/schema.prisma` for ManagedBot, BotSettingsProfile, BotModuleEnablement, BotTemplateSource, BotLifecycleEvent, BotHealthSnapshot, BotProfileImport, and BotProfileExport. FR-001 FR-006 FR-007 FR-009 FR-014 FR-015 FR-020 FR-021
- [x] T012 Create `modules/bot-management/repositories/bot.repository.ts` with create, find, update, archive, uniqueness, and pagination methods. FR-001 FR-011 FR-012 FR-020 SC-001 SC-004
- [ ] T013 [P] Create `settings-profile.repository.ts` for per-bot settings persistence. FR-006
- [ ] T014 [P] Create `module-enablement.repository.ts` for enabled, disabled, unavailable, and blocked module states. FR-007 FR-008 FR-022 SC-009
- [ ] T015 [P] Create `lifecycle-event.repository.ts` for append-only lifecycle history. FR-004 FR-005 SC-007
- [ ] T016 [P] Create `template-source.repository.ts` for template and version attribution. FR-009 FR-010 SC-005
- [ ] T017 [P] Create `health-snapshot.repository.ts` for latest and historical health summaries. FR-013 FR-021
- [ ] T018 [P] Create `import.repository.ts` and `export.repository.ts` for profile import/export requests. FR-014 FR-015 SC-008
- [ ] T019 Add repository unit tests and integration test setup for all persistence paths. FR-001 FR-006 FR-007 FR-009 FR-014 FR-015 FR-020 FR-021 SC-001 SC-008

---

## Phase 4: User Story 1 - Register and Inspect Managed Bots (Priority: P1)

**Goal**: Administrators can register a managed bot and inspect its profile.
**Independent Test**: Register a bot and view its detail screen with identity,
status, owner, locale, module summary, template source, and health summary.

- [x] T020 [P] [US1] Write failing unit tests for `bot.service.ts` registration, duplicate detection, redaction, and detail retrieval. FR-001 FR-016 FR-017 SC-001 SC-003
- [x] T021 [US1] Implement `modules/bot-management/services/bot.service.ts` with register, update, get detail, list, archive, and redacted credential output. FR-001 FR-016 FR-017 FR-020 SC-001 SC-003
- [x] T022 [P] [US1] Create `menus/bot-menu.factory.ts` and `menus/bot-detail.factory.ts`. FR-012 FR-018 SC-006
- [x] T023 [P] [US1] Create `/bots` and `/new_bot` shortcuts in `commands/bots.command.ts` and `commands/new-bot.command.ts`. FR-018 SC-006
- [x] T024 [US1] Create callback and text handler paths for registration and detail views in `handlers/callback.handler.ts` and `handlers/text.handler.ts`. FR-001 FR-012 FR-018
- [ ] T025 [US1] Add integration test for registration, duplicate rejection, detail view data, and credential redaction. FR-001 FR-016 FR-017 SC-001 SC-003

---

## Phase 5: User Story 2 - Govern Bot Lifecycle (Priority: P1)

**Goal**: Administrators can move bots through valid lifecycle states.
**Independent Test**: Exercise every valid and invalid transition and verify
audit history and domain events.

- [ ] T026 [P] [US2] Write failing unit tests for lifecycle guard behavior and reason requirements. FR-002 FR-003 FR-004 SC-002
- [ ] T027 [US2] Implement `services/lifecycle.service.ts` with transition validation, reason checks, event publishing, and lifecycle history. FR-002 FR-003 FR-004 FR-005 FR-019 SC-002 SC-007
- [ ] T028 [P] [US2] Create `menus/lifecycle-menu.factory.ts` with state-aware transition buttons. FR-002 FR-004 FR-018 SC-006
- [ ] T029 [US2] Wire lifecycle callbacks into `handlers/callback.handler.ts` and reason collection into `handlers/text.handler.ts`. FR-002 FR-003 FR-004 FR-018
- [ ] T030 [US2] Add integration test for DRAFT -> CONFIGURED -> ACTIVE -> PAUSED -> ACTIVE -> MAINTENANCE -> ACTIVE -> ARCHIVED. FR-002 FR-003 FR-004 FR-005 SC-002 SC-007

---

## Phase 6: User Story 3 - Manage Bot Settings Profiles (Priority: P1)

**Goal**: Administrators can view and edit per-bot settings.
**Independent Test**: Update settings, verify persistence, event emission, and
invalid-value rejection.

- [ ] T031 [P] [US3] Write failing unit tests for `settings-profile.service.ts`. FR-006 SC-007
- [ ] T032 [US3] Implement `services/settings-profile.service.ts` using settings package contracts and repository persistence. FR-006 FR-019 SC-007
- [ ] T033 [P] [US3] Create `menus/settings-menu.factory.ts` for locale, region, timezone, notification, privacy, and feature toggle views. FR-006 FR-012 FR-018 SC-006
- [ ] T034 [US3] Wire settings callbacks and text input validation into handlers. FR-006 FR-018
- [ ] T035 [US3] Add integration test for settings update, invalid setting rejection, inherited defaults, and settings-changed event. FR-006 FR-019 SC-007

---

## Phase 7: User Story 4 - Enable Modules Per Bot (Priority: P1)

**Goal**: Administrators can enable, disable, or view blocked modules per bot.
**Independent Test**: Toggle implemented modules and verify blocked/unavailable
states are represented and enforced.

- [ ] T036 [P] [US4] Write failing unit tests for `module-enablement.service.ts`. FR-007 FR-008 FR-022 SC-009
- [ ] T037 [US4] Implement `services/module-enablement.service.ts` using module registry metadata and persisted per-bot choices. FR-007 FR-008 FR-019 FR-022 SC-009
- [ ] T038 [P] [US4] Create `menus/module-enablements-menu.factory.ts` with implemented, unavailable, and blocked groupings. FR-007 FR-008 FR-012 FR-018 FR-022 SC-006 SC-009
- [ ] T039 [US4] Wire module enablement callbacks into `handlers/callback.handler.ts`. FR-007 FR-008 FR-018 FR-022
- [ ] T040 [US4] Add integration test for enable, disable, unavailable, blocked, and blocked-reason display flows. FR-007 FR-008 FR-022 SC-009

---

## Phase 8: User Story 5 - Provision Bots From Templates (Priority: P1)

**Goal**: Administrators can create draft bot profiles from published template references.
**Independent Test**: Select a template source and verify source attribution,
initial modules, settings profile, and DRAFT status.

- [ ] T041 [P] [US5] Write failing unit tests for `provisioning.service.ts`. FR-009 FR-010 SC-005
- [ ] T042 [US5] Implement `services/provisioning.service.ts` to create DRAFT bot profiles with template/version attribution and blocked-requirement reporting. FR-009 FR-010 FR-019 FR-022 SC-005 SC-009
- [ ] T043 [P] [US5] Create `menus/provisioning-menu.factory.ts` for template selection and provisioning review. FR-009 FR-010 FR-012 FR-018 SC-006
- [ ] T044 [US5] Wire provisioning callbacks into `handlers/callback.handler.ts`. FR-009 FR-010 FR-018
- [ ] T045 [US5] Add integration test for successful provisioning and missing-module blocked provisioning. FR-009 FR-010 FR-022 SC-005 SC-009

---

## Phase 9: User Story 6 - Search and Filter Managed Bots (Priority: P2)

**Goal**: Administrators can search and filter bot records.
**Independent Test**: Search by identity and filter by status, owner, runtime
mode, template source, and enabled module.

- [ ] T046 [P] [US6] Write failing unit tests for search adapter and filter mapping. FR-011 FR-012 SC-004
- [ ] T047 [US6] Create `contracts/search-adapter.ts` and implement `services/bot-search.service.ts`. FR-011 FR-012 SC-004
- [ ] T048 [US6] Add search, filter, empty-state, and pagination callbacks. FR-011 FR-012 FR-018 SC-004 SC-006
- [ ] T049 [US6] Add integration test with a 1,000-bot fixture for correctness and performance target. FR-011 FR-012 SC-004

---

## Phase 10: User Story 7 - Receive Operational Notifications (Priority: P2)

**Goal**: Administrators receive operational notification requests for important changes.
**Independent Test**: Trigger lifecycle, provisioning, and health events and
verify notification requests are created once per incident window.

- [ ] T050 [P] [US7] Write failing unit tests for `notification.service.ts` event-to-notification mapping. FR-013 FR-019 SC-007
- [ ] T051 [US7] Implement `services/health.service.ts` for health snapshots, flapping guard, and health-changed events. FR-013 FR-019 FR-021 SC-007
- [ ] T052 [US7] Implement `services/notification.service.ts` and `handlers/notification.handler.ts` for lifecycle, provisioning, and health notifications. FR-013 FR-019 FR-021 SC-007
- [ ] T053 [P] [US7] Create `menus/health-menu.factory.ts` for latest health status display. FR-021 FR-012 FR-018
- [ ] T054 [US7] Add integration test for notification requests and health flapping suppression. FR-013 FR-019 FR-021 SC-007

---

## Phase 11: User Story 8 - Export and Import Bot Profiles (Priority: P3)

**Goal**: Administrators can export and import non-sensitive bot profiles.
**Independent Test**: Export a profile, import it into DRAFT, and verify
non-sensitive data, blocked requirements, and redaction behavior.

- [ ] T055 [P] [US8] Write failing unit tests for export redaction and import validation. FR-014 FR-015 FR-016 SC-003 SC-008
- [ ] T056 [US8] Implement `services/export.service.ts` to produce non-sensitive bot profile exports and storage/document requests. FR-014 FR-016 SC-003 SC-008
- [ ] T057 [US8] Implement `services/import.service.ts` to validate profile imports, create DRAFT profiles, and report blocked requirements. FR-015 FR-016 FR-022 SC-008 SC-009
- [ ] T058 [P] [US8] Create `menus/export-menu.factory.ts` and import/export callback paths. FR-014 FR-015 FR-018 SC-006
- [ ] T059 [US8] Add integration test for export/import round-trip, missing requirements, and secret redaction. FR-014 FR-015 FR-016 FR-022 SC-003 SC-008 SC-009

---

## Phase 12: Documentation, Reconciliation, and Gates

**Purpose**: Prove methodology compliance and prepare for merge.

- [ ] T060 Update `modules/bot-management/README.md`, `docs/product/modules/bot-management.md`, and `docs/ROADMAP.md`. FR-001 SC-010
- [ ] T061 Create a changeset documenting the new private operational module. SC-010
- [ ] T062 Run `pnpm tempot module doctor bot-management` and fix all readiness issues. SC-010
- [ ] T063 Run `pnpm cms:check` after locale changes and fix parity issues. SC-003 SC-006
- [ ] T064 Run `pnpm boundary:audit` and `pnpm module:checklist` with zero violations. SC-010
- [ ] T065 Run `pnpm lint`, `pnpm build`, `pnpm test:unit`, and relevant `pnpm test:integration` gates. SC-010
- [ ] T066 Run `pnpm spec:validate` and resolve all CRITICAL/HIGH issues. SC-010
- [ ] T067 Run `git diff --check` and prepare review handoff summary. SC-010

---

## Dependencies and Execution Order

- Phase 1 blocks all module work.
- Phase 2 blocks persistence and services.
- Phase 3 blocks all user-story services.
- US1 is the MVP slice and should complete before other Telegram presentation flows.
- US2, US3, and US4 can proceed after Phase 3 and US1 foundations.
- US5 depends on US1, US3, and US4.
- US6 can proceed after Phase 3.
- US7 depends on event contracts and the lifecycle/health services.
- US8 depends on registry, settings, module enablement, and template source data.
- Phase 12 runs after selected implementation scope is complete.

## Parallel Opportunities

- T005, T006, T008, T010 can run in parallel after setup.
- Repository tasks T013-T018 can run in parallel after schema design.
- Menu factory tasks can run in parallel with service tests when file ownership is separated.
- US6 search work can run in parallel with US7 notification work after foundational repositories exist.

## MVP Recommendation

The minimum viable implementation is:

1. Phase 1: Setup
2. Phase 2: Foundational Contracts
3. Phase 3: Persistence
4. Phase 4: Register and Inspect Managed Bots
5. Phase 5: Govern Bot Lifecycle
6. Phase 6: Manage Bot Settings Profiles
7. Phase 7: Enable Modules Per Bot

US5-US8 should remain in the same spec because they define the professional
module target, but they may be scheduled after the MVP slice if the Project
Manager wants a smaller first execution batch.
