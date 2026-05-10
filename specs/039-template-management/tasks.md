# Template Management Module — Tasks

**Feature:** 039-template-management
**Source:** spec.md + plan.md + data-model.md + research.md
**Generated:** 2026-05-10

---

## Layer 1: Foundation

### Task 1: Module Scaffolding
- [ ] Create `modules/template-management/package.json` with dependencies
- [ ] Create `tsconfig.json` extending root config
- [ ] Create `vitest.config.ts`
- [ ] Create `.gitignore`
- [ ] Create `index.ts` with public exports
- [ ] Create `README.md` with module overview
- **Depends on**: Nothing
- **FR**: FR-001
- **SC**: SC-006, SC-007, SC-008

### Task 2: Module Config and Manifest
- [ ] Create `module.config.ts` with commands, features, and dependencies
- [ ] Create `module.manifest.ts` with metadata and capabilities
- **Depends on**: Task 1
- **FR**: FR-014

### Task 3: Type Definitions
- [ ] Create `types/template.types.ts` — Template, TemplateVersion, TemplateContent, TemplateStatus
- [ ] Create `types/category.types.ts` — Category, Tag, Rating, Subscription
- [ ] Create `types/menu.types.ts` — TemplateAction callback namespace
- [ ] Create `types/navigation.types.ts` — wizard and navigation state
- **Depends on**: Task 1
- **FR**: FR-001, FR-019

### Task 4: Zod Validation Schemas
- [ ] Create `contracts/template-content.schema.ts` — templateContentSchema, createTemplateSchema
- [ ] Create `contracts/template-bundle.schema.ts` — templateBundleSchema for import/export
- [ ] Write unit tests for schema validation (valid and invalid inputs)
- **Depends on**: Task 3
- **FR**: FR-016, FR-019
- **SC**: SC-004, SC-009

### Task 5: Lifecycle State Machine
- [ ] Create `contracts/lifecycle-transitions.ts` — VALID_TRANSITIONS, canTransition, transition guards
- [ ] Write unit tests for all valid transitions and invalid transition rejections
- **Depends on**: Task 3
- **FR**: FR-002
- **SC**: SC-004, SC-009

### Task 6: Event Contracts
- [ ] Create `events/event-names.ts` — all template event name constants
- [ ] Create `events/event-payloads.ts` — typed event payload interfaces
- **Depends on**: Task 3
- **FR**: FR-010

### Task 7: Abilities (RBAC)
- [ ] Create `abilities.ts` — GUEST, USER, ADMIN, SUPER_ADMIN permissions
- [ ] Write unit tests for permission checks per role
- **Depends on**: Task 3
- **FR**: FR-012
- **SC**: SC-009

### Task 8: Locale Files
- [ ] Create `locales/ar.json` — all Arabic UI text
- [ ] Create `locales/en.json` — all English UI text
- [ ] Verify locale key parity between ar and en
- **Depends on**: Task 2
- **FR**: FR-013
- **SC**: SC-005

---

## Layer 2: Persistence

### Task 9: Prisma Schema and Migration
- [ ] Create `database/schema.prisma` — templates, template_versions, categories, tags, template_tags, template_ratings, template_subscriptions
- [ ] Add full-text search vector (tsvector) and GIN indexes
- [ ] Run Prisma migration and generate client
- **Depends on**: Task 3
- **FR**: FR-001

### Task 10: Template Repository
- [ ] Create `repositories/template.repository.ts` — create, findById, findBySlug, update, updateStatus, softDelete, search with tsvector, count, list with pagination
- [ ] Write unit tests for all repository methods
- **Depends on**: Task 9
- **FR**: FR-001, FR-005
- **SC**: SC-001, SC-009

### Task 11: Version Repository
- [ ] Create `repositories/version.repository.ts` — createSnapshot, findByTemplate, findByVersion
- [ ] Write unit tests
- **Depends on**: Task 9
- **FR**: FR-003
- **SC**: SC-009

### Task 12: Category Repository
- [ ] Create `repositories/category.repository.ts` — create, update, delete, findBySlug, listHierarchy, reorder, getDepth
- [ ] Write unit tests
- **Depends on**: Task 9
- **FR**: FR-004
- **SC**: SC-009

### Task 13: Tag Repository
- [ ] Create `repositories/tag.repository.ts` — createOrFind, search, listPopular, incrementUsage
- [ ] Write unit tests
- **Depends on**: Task 9
- **FR**: FR-004
- **SC**: SC-009

### Task 14: Rating Repository
- [ ] Create `repositories/rating.repository.ts` — upsert, getByUser, calculateAverage
- [ ] Write unit tests
- **Depends on**: Task 9
- **FR**: FR-008
- **SC**: SC-009

### Task 15: Subscription Repository
- [ ] Create `repositories/subscription.repository.ts` — create, delete, findByTemplate, findByUser, exists
- [ ] Write unit tests
- **Depends on**: Task 9
- **FR**: FR-015
- **SC**: SC-009

---

## Layer 3: Business Logic

### Task 16: Template Service
- [ ] Create `services/template.service.ts` — create, update, getById, getBySlug, delete, list with pagination, slug generation
- [ ] All methods return `Result<T, AppError>`
- [ ] Write unit tests with mocked repository
- **Depends on**: Task 4, Task 10
- **FR**: FR-001, FR-021
- **SC**: SC-001, SC-009

### Task 17: Lifecycle Service
- [ ] Create `services/lifecycle.service.ts` — transition with guards, completeness validation, emit events
- [ ] Write unit tests for every valid and invalid transition path
- **Depends on**: Task 5, Task 6, Task 10
- **FR**: FR-002, FR-010, FR-016
- **SC**: SC-004, SC-009

### Task 18: Version Service
- [ ] Create `services/version.service.ts` — createSnapshot, suggestBumpType (diff-based), listVersions, getVersion
- [ ] Write unit tests
- **Depends on**: Task 11, Task 17
- **FR**: FR-003
- **SC**: SC-009

### Task 19: Clone Service
- [ ] Create `services/clone.service.ts` — clone template, auto-subscribe, increment usage
- [ ] Write unit tests
- **Depends on**: Task 10, Task 15
- **FR**: FR-009, FR-018
- **SC**: SC-009

### Task 20: Search Service
- [ ] Create `contracts/search-adapter.ts` — TemplateSearchAdapter implementing search-engine plan interface
- [ ] Create `services/search.service.ts` — search, filter, sort, paginate
- [ ] Write unit tests
- **Depends on**: Task 10, Task 12, Task 13
- **FR**: FR-005
- **SC**: SC-002, SC-009

### Task 21: Category Service
- [ ] Create `services/category.service.ts` — create, update, delete, listHierarchy, depth guard (max 3)
- [ ] Write unit tests
- **Depends on**: Task 12
- **FR**: FR-004
- **SC**: SC-009

### Task 22: Tag Service
- [ ] Create `services/tag.service.ts` — createOrFind, slugify, autocomplete, assignToTemplate
- [ ] Write unit tests
- **Depends on**: Task 13
- **FR**: FR-004
- **SC**: SC-009

### Task 23: Rating Service
- [ ] Create `services/rating.service.ts` — rate, updateRating, getAverage, recalculate
- [ ] Write unit tests
- **Depends on**: Task 14
- **FR**: FR-008
- **SC**: SC-009

### Task 24: Subscription Service
- [ ] Create `services/subscription.service.ts` — subscribe, unsubscribe, getSubscribers, isSubscribed
- [ ] Write unit tests
- **Depends on**: Task 15
- **FR**: FR-015
- **SC**: SC-009

### Task 25: Export Service
- [ ] Create `services/export.service.ts` — buildJsonBundle, requestPdfExport via document-engine
- [ ] Write unit tests (JSON round-trip, PDF request contract)
- **Depends on**: Task 16, Task 18
- **FR**: FR-006
- **SC**: SC-003, SC-009

### Task 26: Import Service
- [ ] Create `services/import.service.ts` — validateBundle, resolveCategories, resolveTags, createDraftFromBundle
- [ ] Write unit tests (valid bundle, invalid bundle, missing categories)
- **Depends on**: Task 4, Task 16, Task 21, Task 22
- **FR**: FR-007
- **SC**: SC-003, SC-009

---

## Layer 4: Presentation

### Task 27: Menu Factories
- [ ] Create `menus/template-menu.factory.ts` — main template menu (my templates, browse, create)
- [ ] Create `menus/browse-menu.factory.ts` — browse with categories, search, sort
- [ ] Create `menus/template-detail.factory.ts` — detail view with actions based on status and role
- [ ] Create `menus/lifecycle-menu.factory.ts` — lifecycle transition buttons
- [ ] Create `menus/category-menu.factory.ts` — category management (admin)
- [ ] Create `menus/export-menu.factory.ts` — export format selection (JSON/PDF)
- [ ] Create `menus/rating-menu.factory.ts` — 1-5 star rating keyboard
- [ ] Write unit tests for all menu factories (role-based button visibility)
- **Depends on**: Task 3, Task 7, Task 8
- **FR**: FR-014
- **SC**: SC-009, SC-010

### Task 28: Commands
- [ ] Create `commands/templates.command.ts` — `/templates` shortcut to template menu
- [ ] Create `commands/new-template.command.ts` — `/new_template` shortcut to creation wizard
- [ ] Create `commands/import-template.command.ts` — `/import_template` for file import
- **Depends on**: Task 16, Task 27
- **FR**: FR-014

### Task 29: Callback Handler
- [ ] Create `handlers/callback.handler.ts` — route all `tmpl:*` callbacks to appropriate services
- [ ] Handle: CRUD, lifecycle, versioning, clone, search, categories, tags, rating, subscription, pagination, export
- **Depends on**: Task 16-26, Task 27
- **FR**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, FR-009, FR-012, FR-014, FR-015, FR-018, FR-020

### Task 30: Text Handler
- [ ] Create `handlers/text.handler.ts` — creation wizard steps, search queries, rejection reasons, tag input
- **Depends on**: Task 16, Task 20, Task 27
- **FR**: FR-001, FR-005

### Task 31: Notification Handler
- [ ] Create `handlers/notification.handler.ts` — listen for template events, query subscribers, enqueue via notifier
- **Depends on**: Task 6, Task 24
- **FR**: FR-011
- **SC**: SC-009

### Task 32: CMS Integration
- [ ] Register CMS protected keys for official template descriptions
- [ ] Integrate cms-engine for official template metadata read/write
- **Depends on**: Task 16
- **FR**: FR-013, FR-020

---

## Layer 5: Integration Testing

### Task 33: Template CRUD Integration Test
- [ ] Test full create → read → update → soft-delete flow
- [ ] Verify Result pattern on all operations
- **Depends on**: Task 16, Task 29, Task 30
- **FR**: FR-001
- **SC**: SC-001

### Task 34: Lifecycle Integration Test
- [ ] Test DRAFT → REVIEW → PUBLISHED → ARCHIVED full path
- [ ] Test invalid transitions return clear errors
- [ ] Test guard enforcement (completeness, RBAC)
- **Depends on**: Task 17, Task 29
- **FR**: FR-002
- **SC**: SC-004

### Task 35: Clone Integration Test
- [ ] Test clone creates DRAFT with link to source
- [ ] Test usage count increment
- [ ] Test auto-subscription creation
- **Depends on**: Task 19, Task 29
- **FR**: FR-009, FR-018

### Task 36: Search Integration Test
- [ ] Test full-text search with relevance ranking
- [ ] Test category and tag filtering
- [ ] Test sort by rating, usage, date
- [ ] Test pagination
- **Depends on**: Task 20, Task 29
- **FR**: FR-005
- **SC**: SC-002

### Task 37: Import/Export Integration Test
- [ ] Test JSON export → import round-trip with zero data loss
- [ ] Test PDF export generates valid document request
- [ ] Test import with missing categories auto-creates them
- [ ] Test invalid bundle returns field-level errors
- **Depends on**: Task 25, Task 26
- **FR**: FR-006, FR-007
- **SC**: SC-003

---

## Layer 6: Quality Gates

### Task 38: Performance Benchmark
- [ ] Verify CRUD operations complete in < 500ms
- [ ] Verify search returns results in < 1s for 1000-template dataset
- **Depends on**: Task 33, Task 36
- **SC**: SC-001, SC-002
- **NFR**: < 500ms, < 1s

### Task 39: Boundary and Checklist Audit
- [ ] Run `pnpm boundary:audit` — zero violations
- [ ] Run `pnpm module:checklist` — zero violations
- [ ] Run `pnpm lint` — zero errors
- [ ] Run `pnpm build` — zero errors
- [ ] Run `pnpm test:unit` — all pass
- [ ] Run `pnpm spec:validate` — zero CRITICAL
- [ ] Run `pnpm cms:check` — pass
- **Depends on**: All previous tasks
- **SC**: SC-005, SC-006, SC-007, SC-008, SC-009, SC-010

### Task 40: Documentation Finalization
- [ ] Update `README.md` with final commands, architecture, and testing
- [ ] Update `docs/ROADMAP.md` with template-management status
- [ ] Update module catalog if needed
- **Depends on**: Task 39
