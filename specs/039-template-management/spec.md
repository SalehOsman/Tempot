# Feature Specification: Template Management Module

**Feature Branch**: `039-template-management`
**Created**: 2026-05-10
**Status**: Draft
**Priority**: P1 (Phase 3B — first product module)

---

## Purpose

Implement a template management module that allows users to create, version,
publish, search, import, and export bot feature templates. Templates are
reusable bot configurations containing commands, messages, input forms,
permissions, and settings. The module follows a governed lifecycle
(DRAFT → REVIEW → PUBLISHED → ARCHIVED) and integrates with most Tempot
infrastructure packages.

This is the first **Product-type** module in the Tempot catalog, serving as the
reference implementation for modules that combine multiple package capabilities.

### Template Content Structure

Every template is a structured bundle, not just metadata:

| Component | Description | Required |
| --- | --- | --- |
| **Metadata** | Name, description, category, tags, language, author | Yes |
| **Commands** | Bot command definitions (`/order`, `/help`, etc.) | Yes |
| **Messages** | i18n-keyed text blocks (welcome, errors, confirmations) | Yes |
| **Input Forms** | Multi-step input form definitions via `input-engine` | Optional |
| **Permissions** | Required RBAC abilities to run the template | Optional |
| **Settings** | Configurable values (timeouts, limits, toggles) | Optional |

### Activation Model

Activation means **cloning** a published template into the user's workspace as
a new DRAFT. The clone retains a link to the source template for update
notifications and usage analytics. Template execution (converting a template
into a running bot) is out of scope — that is a future Template Execution
Engine concern.

### CMS Strategy

- **Module UI text** (buttons, labels, error messages): managed via
  `i18n-core` locale files.
- **Official template descriptions** (curated by the Tempot team): managed
  via `cms-engine` with protected keys and placeholder validation.
- **User-created template descriptions**: stored in the database directly.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Template CRUD via Buttons (Priority: P0)

As a template author, I want to create and manage bot templates through Inline
Keyboard buttons so that I can build reusable bot configurations without
memorizing commands.

**Why this priority**: Core functionality — without CRUD, no other feature
works.

**Independent Test**: Create a template, view it, edit metadata, and delete a
draft — all via Inline Keyboard interactions.

**Acceptance Scenarios**:

1. **Given** the main menu is displayed, **When** I click the "📦 القوالب"
   button, **Then** the template management menu is displayed with options:
   my templates, browse, create new.
2. **Given** the template menu is displayed, **When** I click "➕ قالب جديد",
   **Then** a multi-step creation wizard starts collecting: name, description,
   category, and language.
3. **Given** the creation wizard completes, **When** I submit, **Then** a new
   template is created in DRAFT status and I see its detail view.
4. **Given** a template detail view, **When** I click "✏️ تعديل", **Then**
   editable fields are shown as Inline Keyboard options.
5. **Given** a DRAFT template, **When** I click "🗑️ حذف", **Then** a
   confirmation dialog is shown; on confirm the template is soft-deleted.

---

### User Story 2 - Template Lifecycle Management (Priority: P0)

As a template author, I want to submit my template for review and track its
status so that published templates meet quality standards.

**Why this priority**: The lifecycle ensures template quality and is essential
for a professional marketplace experience.

**Independent Test**: Move a template through DRAFT → REVIEW → PUBLISHED →
ARCHIVED, verifying state guards at each transition.

**Acceptance Scenarios**:

1. **Given** a DRAFT template with all required fields, **When** I click
   "📤 إرسال للمراجعة", **Then** the status changes to REVIEW and the author
   cannot edit content (metadata corrections only).
2. **Given** a REVIEW template and I am an Admin, **When** I click "✅ نشر",
   **Then** the status changes to PUBLISHED, a version snapshot is created,
   and subscribed users are notified.
3. **Given** a REVIEW template and I am an Admin, **When** I click "↩️ إرجاع",
   **Then** the status returns to DRAFT with a rejection reason attached.
4. **Given** a PUBLISHED template, **When** the author clicks "📥 أرشفة",
   **Then** the status changes to ARCHIVED and the template is hidden from
   browse but its data is preserved.
5. **Given** an ARCHIVED template, **When** the author clicks "♻️ إعادة نشر",
   **Then** the status returns to DRAFT for a new review cycle.

---

### User Story 3 - Browse and Search Templates (Priority: P0)

As a user, I want to browse and search published templates by category, tag,
or keyword so that I can find relevant bot configurations quickly.

**Why this priority**: Discovery is the primary way users interact with
templates — without it the module has no product value.

**Independent Test**: Search for templates by keyword, filter by category and
tag, paginate results — all returning correct and ranked results.

**Acceptance Scenarios**:

1. **Given** the template menu, **When** I click "🔍 تصفح القوالب", **Then**
   published templates are listed with pagination (10 per page).
2. **Given** the browse view, **When** I click "🏷️ تصنيفات", **Then**
   categories are shown as Inline Keyboard buttons; selecting one filters
   results.
3. **Given** the browse view, **When** I click "🔎 بحث", **Then** I am
   prompted for a text query; results are ranked by relevance using
   `search-engine`.
4. **Given** search results, **When** I click a template button, **Then**
   the template detail view is shown with: name, description, author, version,
   rating, usage count, and action buttons.
5. **Given** no results match the query, **When** results are displayed,
   **Then** a "لا توجد نتائج" message is shown with "🔙 العودة" button.

---

### User Story 4 - Template Versioning (Priority: P0)

As a template author, I want to version my templates so that users on older
versions are not affected by my changes and I can track the evolution history.

**Why this priority**: Versioning enables safe updates without breaking
existing users — essential for production trust.

**Independent Test**: Publish v1.0.0, edit and publish v1.1.0, verify both
snapshots are independently accessible.

**Acceptance Scenarios**:

1. **Given** a PUBLISHED template, **When** the publish transition occurs,
   **Then** an immutable version snapshot is created with semver
   (MAJOR.MINOR.PATCH).
2. **Given** a template with multiple versions, **When** I view version history,
   **Then** all versions are listed with date, author, and change summary.
3. **Given** a template with versions, **When** a user activates the template,
   **Then** the latest published version is used by default.
4. **Given** a breaking change, **When** the author bumps MAJOR version,
   **Then** existing users remain on the previous version until they manually
   upgrade.

---

### User Story 5 - Template Import and Export (Priority: P0)

As a template author, I want to export templates as JSON bundles or PDF
documentation and import them so that I can share templates across Tempot
instances and present them to stakeholders.

**Why this priority**: Portability and documentation make templates valuable
beyond a single bot instance.

**Independent Test**: Export a template to JSON and PDF, import the JSON into
a clean environment, verify all data is preserved.

**Acceptance Scenarios**:

1. **Given** a template detail view, **When** I click "📤 تصدير", **Then**
   export format options are shown: JSON bundle or PDF documentation.
2. **Given** I select JSON export, **When** the export completes, **Then**
   a JSON bundle file is generated via `document-engine` and sent as a
   Telegram document.
3. **Given** I select PDF export, **When** the export completes, **Then**
   a PDF document is generated containing metadata, commands list, messages,
   version history, and author info — sent as a Telegram document.
4. **Given** a JSON bundle file, **When** I send it to the bot with
   `/import_template`, **Then** `import-engine` validates the schema and
   creates a DRAFT template with all data preserved.
5. **Given** an invalid JSON bundle, **When** import is attempted, **Then**
   validation errors are displayed with specific field-level messages.
6. **Given** an exported bundle, **When** it references categories or tags
   that do not exist locally, **Then** missing categories/tags are created
   automatically during import.

---

### User Story 6 - Categories, Tags, and Collections (Priority: P0)

As an admin, I want to manage categories and tags so that templates are
organized and discoverable.

**Why this priority**: Classification structure is required for search and
browse to work professionally.

**Independent Test**: Create a category hierarchy, assign tags to templates,
verify filtering works correctly.

**Acceptance Scenarios**:

1. **Given** the admin template menu, **When** I click "🗂️ إدارة التصنيفات",
   **Then** categories are listed with options to add, edit, reorder, and
   delete.
2. **Given** a category, **When** I add a subcategory, **Then** it appears
   nested under the parent in browse views.
3. **Given** a template edit view, **When** I click "🏷️ الوسوم", **Then**
   I can add free-form tags or select from existing tags (autocomplete).
4. **Given** a category with templates, **When** I attempt to delete it,
   **Then** I must first reassign or confirm orphaning the templates.

---

### User Story 7 - Ratings and Usage Analytics (Priority: P0)

As a user, I want to rate templates and see usage statistics so that I can
identify high-quality templates.

**Why this priority**: Social proof improves discovery but is not required for
core functionality.

**Independent Test**: Rate a template, verify average is recalculated, verify
usage counter increments on activation.

**Acceptance Scenarios**:

1. **Given** a published template detail view, **When** I click "⭐ تقييم",
   **Then** I can select 1-5 stars via Inline Keyboard.
2. **Given** a template I have rated, **When** I view it again, **Then**
   my rating is shown and I can update it.
3. **Given** a published template, **When** a user activates it, **Then**
   the usage counter increments.
4. **Given** the browse view, **When** I sort by "الأكثر استخداماً" or
   "الأعلى تقييماً", **Then** templates are ordered accordingly.

---

### User Story 8 - Notification System (Priority: P0)

As a template subscriber, I want to receive notifications when templates I use
are updated so that I can review and adopt changes.

**Why this priority**: Keeps users informed but is not blocking for MVP.

**Independent Test**: Subscribe to a template, publish a new version, verify
notification is delivered via `notifier`.

**Acceptance Scenarios**:

1. **Given** a published template detail view, **When** I click "🔔 متابعة",
   **Then** I am subscribed to update notifications for this template.
2. **Given** I am subscribed, **When** a new version is published, **Then**
   I receive a notification via `notifier` with version details and upgrade
   link.
3. **Given** a template in REVIEW status, **When** it is pending, **Then**
   admins with review permissions receive a notification.

---

### Edge Cases

- **Duplicate template name**: System allows same name from different authors;
  uniqueness is per-author. Display both in search with author attribution.
- **Large template bundle**: Import validates file size (max 5MB) and depth
  (max 100 commands) before processing.
- **Concurrent state transition**: Optimistic locking via `updatedAt`
  timestamp; display "تم تحديث البيانات مؤخراً" with retry button.
- **Orphaned versions**: When a template is deleted, version snapshots are
  soft-deleted but remain in the database for audit purposes.
- **Category depth limit**: Maximum 3 levels of nesting to prevent UI
  complexity.
- **Rate limiting**: Template creation limited to 10 per user per day to
  prevent abuse.
- **Empty template**: A template must have at least a name and description
  to leave DRAFT status.
- **Language mismatch on import**: Imported locale keys are merged; missing
  keys are flagged as warnings, not errors.

---

## Non-Goals

- No AI-powered template recommendations in this spec (future spec).
- No AI-powered content review in this spec (future spec).
- No public marketplace or external sharing (future Tempot Cloud feature).
- No real-time collaboration on template editing.
- No template monetization or payment integration.
- No dashboard or mini-app UI (Telegram bot only).
- No template execution runtime — this module manages template data only;
  the execution engine that activates templates in a running bot is a
  separate future concern.

---

## Out of Scope

- `content-management` module (separate spec).
- `bot-management` module (separate spec).
- `notification-center` module (separate spec; this module only emits events
  consumed by `notifier` directly).
- Template execution engine (future Phase 4+).

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support full CRUD operations for templates with
  soft-delete.
- **FR-002**: System MUST enforce a lifecycle state machine:
  DRAFT → REVIEW → PUBLISHED → ARCHIVED, with guarded transitions.
- **FR-003**: System MUST create immutable version snapshots on every PUBLISH
  transition with semver numbering.
- **FR-004**: System MUST support hierarchical categories (max 3 levels) and
  free-form tags for template classification.
- **FR-005**: System MUST provide full-text search via `search-engine` with
  filtering by category, tag, status, author, and sort by relevance, rating,
  usage, and date.
- **FR-006**: System MUST export templates as validated JSON bundles and as
  PDF documentation via `document-engine`.
- **FR-007**: System MUST import template JSON bundles via `import-engine`
  with schema validation and error reporting.
- **FR-008**: System MUST support 1-5 star ratings per user per template with
  average calculation.
- **FR-009**: System MUST track usage count (activations) per template.
- **FR-010**: System MUST emit events via `event-bus` for: template created,
  status changed, version published, template deleted.
- **FR-011**: System MUST send notifications via `notifier` for: new version
  published (to subscribers), template pending review (to admins).
- **FR-012**: System MUST enforce RBAC via `auth-core`:
  - GUEST: browse and view published templates.
  - USER: browse, view, create, manage own templates, rate, subscribe.
  - ADMIN: all USER abilities plus review, publish, manage categories/tags,
    manage all templates.
  - SUPER_ADMIN: all ADMIN abilities.
- **FR-013**: System MUST support bilingual content (Arabic and English) for
  all template metadata and UI via `i18n-core` and `cms-engine`.
- **FR-014**: System MUST provide 90% Inline Keyboard interaction, 10% command
  shortcuts, consistent with the Tempot UX standard.
- **FR-015**: System MUST support template subscriptions (follow/unfollow) for
  update notifications.
- **FR-016**: System MUST validate template completeness before allowing
  DRAFT → REVIEW transition (name, description, category, and at least one
  command definition required at minimum).
- **FR-018**: System MUST support template cloning (activation): creating a
  user-owned DRAFT copy of a published template while retaining a link to
  the source template.
- **FR-019**: System MUST store template content structure including command
  definitions, message blocks, optional input form definitions, optional
  permission requirements, and optional settings declarations.
- **FR-020**: System MUST manage official template descriptions via
  `cms-engine` with protected keys, while user-created template descriptions
  are stored in the database directly.
- **FR-021**: System MUST support pagination for all list views (10 items per
  page default, configurable via `settings`).

### Key Entities

- **Template**: Core entity with metadata, content structure, lifecycle status,
  and author reference.
- **TemplateVersion**: Immutable snapshot created on publish; linked to parent
  template with semver.
- **Category**: Hierarchical classification (max 3 levels) with display name,
  slug, icon, and sort order.
- **Tag**: Free-form label attached to templates; reusable across templates.
- **Rating**: Per-user per-template star rating (1-5).
- **Subscription**: User subscription to a template for update notifications.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Template CRUD operations complete in < 500ms response time.
- **SC-002**: Template search returns results in < 1s for a catalog of 1000
  templates.
- **SC-003**: Import/export round-trip preserves 100% of template data with
  zero data loss.
- **SC-004**: All lifecycle transitions are guarded — invalid transitions
  return clear error messages.
- **SC-005**: 100% of user-facing text uses i18n keys (zero hardcoded text).
- **SC-006**: `pnpm spec:validate` passes with zero CRITICAL issues.
- **SC-007**: `pnpm boundary:audit` passes with zero violations.
- **SC-008**: `pnpm module:checklist` passes with zero violations.
- **SC-009**: Unit test coverage for all services, repositories, and
  state-machine logic.
- **SC-010**: All Inline Keyboard flows have consistent back-navigation.

---

## Assumptions

- The module operates within Telegram bot context only (no dashboard).
- `user-management` module is implemented and provides user/role context.
- All 22 infrastructure packages are available and stable.
- Templates are data definitions only — this module does not execute or
  activate templates in a running bot. Execution is a future concern.
- Maximum template catalog size is ~1000 templates; performance targets are
  based on this scale.
- Template content structure (commands, messages, forms, permissions,
  settings) is defined in this spec and detailed in `data-model.md`.

---

## Dependencies

### Core Dependencies

- **@tempot/database**: Template, version, category, tag, rating, and
  subscription repositories.
- **@tempot/auth-core**: RBAC abilities for template operations.
- **@tempot/event-bus**: Lifecycle and activity events.
- **@tempot/shared**: Result pattern, AppError, validation utilities.
- **@tempot/i18n-core**: All UI text and template metadata localization.

### Feature Dependencies

- **@tempot/search-engine**: Full-text and filtered template search.
- **@tempot/import-engine**: Template bundle import with validation.
- **@tempot/document-engine**: Template bundle export to JSON.
- **@tempot/cms-engine**: Dynamic editable text for template descriptions.
- **@tempot/notifier**: Subscription and review notifications.
- **@tempot/settings**: Configurable pagination, rate limits, and feature
  toggles.

### Presentation Dependencies

- **@tempot/ux-helpers**: Inline keyboards, pagination, confirmation dialogs.
- **@tempot/regional-engine**: Date and number formatting.
- **@tempot/module-registry**: Module config and toggle registration.

---

## Technical Constraints

### Blueprints Used

Per module catalog: `basic` + `crud` + `workflow` + `searchable` +
`importable` + `exportable` + `notifiable` + `cms-enabled` + `admin-managed`.

### UI/UX Constraints

- Primary interaction: Inline Keyboards (90%).
- Secondary interaction: Commands (10%) — `/templates`, `/new_template`,
  `/import_template`.
- Max buttons per row: 2-3 for readability.
- Emoji icons required for visual clarity.
- Back navigation on all non-root screens.
- Confirmation dialogs for destructive and irreversible actions.

### Performance Constraints

- Response time: < 500ms for CRUD and navigation.
- Search response: < 1s for full-text queries.
- Cache: Published template metadata cached via `settings` cache layer.
- Pagination: 10 items per page default.

### Security Constraints

- RBAC enforced on every operation via `abilities.ts`.
- Template creation rate limited to 10 per user per day.
- Import bundle size limited to 5MB.
- All inputs validated before persistence.
- Soft-delete only — no permanent deletion except by SUPER_ADMIN.

---

## Implementation Scope

All features are delivered in a single release. No phased deferral.

| Stories | Scope |
| ------- | ----- |
| US-1, US-2, US-3, US-6 | CRUD + lifecycle + categories/tags + search |
| US-4 | Versioning with immutable snapshots |
| US-5 | Import (JSON) + Export (JSON and PDF) |
| US-7 | Ratings and usage analytics |
| US-8 | Notification system for subscribers and reviewers |

---

## References

- Constitution Rule XLVI: Module Creation Gate
- Constitution Rule XXXIX: i18n-Only Rule
- Constitution Rule XXI: Result Pattern
- Constitution Rule XV: Event-Driven Communication
- Module Development Catalog: `docs/developer/module-development-catalog.md`
- Template Marketplace Plan: `docs/architecture/template-marketplace.md`
- Spec #025: user-management (reference implementation)
- Spec #036: module development platform
