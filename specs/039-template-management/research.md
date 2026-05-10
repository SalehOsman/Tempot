# Template Management Module — Technical Research

**Feature:** 039-template-management
**Source:** spec.md
**Generated:** 2026-05-10

---

## Overview

This is a **product module** with significant technical research required. The
module combines CRUD, workflow lifecycle, versioning, search, import/export,
ratings, notifications, and CMS integration — making it the most package-
integrated module in the Tempot catalog.

---

## Research Topic 1: Template Content Structure as JSONB

### Question

How should template content (commands, messages, forms, permissions, settings)
be stored and validated?

### Investigation

**Sources Checked**:
1. Prisma 7.x documentation — JSON/JSONB field support
2. PostgreSQL 16 documentation — JSONB operators and indexes
3. Zod documentation — JSON schema validation
4. Existing `@tempot/input-engine` contracts — form definition patterns

### Findings

**Recommended Approach**: Store template content as a typed JSONB column in
PostgreSQL with Zod validation at the application layer.

**Structure**:
```typescript
interface TemplateContent {
  commands: TemplateCommandDef[];
  messages: TemplateMessageDef[];
  inputForms?: TemplateInputFormDef[];
  permissions?: TemplatePermissionDef[];
  settings?: TemplateSettingDef[];
}

interface TemplateCommandDef {
  name: string;          // e.g., "order"
  description: string;   // i18n key
  handler?: string;      // handler reference
}

interface TemplateMessageDef {
  key: string;           // i18n key
  defaultText: Record<string, string>; // { ar: "...", en: "..." }
  placeholders?: string[];
}

interface TemplateInputFormDef {
  name: string;
  steps: { field: string; type: string; validation?: string }[];
}

interface TemplatePermissionDef {
  action: string;
  subject: string;
  minRole: string;
}

interface TemplateSettingDef {
  key: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: unknown;
  description: string;
}
```

**Why JSONB over relational tables**:
- Template content is a self-contained bundle — not queried individually.
- JSONB allows schema evolution without migrations.
- Zod validation at the service layer ensures type safety.
- Version snapshots copy the entire JSONB blob — simple and atomic.

**GIN Index**: Create a GIN index on the JSONB column for searching within
template content if needed.

### Decision

Use JSONB for template content with Zod validation. Relational fields
(metadata, lifecycle, author, category) remain as normal columns.

---

## Research Topic 2: Lifecycle State Machine

### Question

How should the template lifecycle (DRAFT → REVIEW → PUBLISHED → ARCHIVED) be
implemented with guarded transitions?

### Investigation

**Sources Checked**:
1. XState library documentation
2. Simple state-machine patterns in TypeScript
3. Existing Tempot patterns in `@tempot/shared`

### Findings

**Recommended Approach**: A lightweight typed state machine without external
libraries. XState is powerful but adds unnecessary complexity for 4 states.

```typescript
const VALID_TRANSITIONS: Record<TemplateStatus, TemplateStatus[]> = {
  DRAFT:     ['REVIEW'],
  REVIEW:    ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED:  ['DRAFT'],
};

function canTransition(from: TemplateStatus, to: TemplateStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Transition Guards**:
| Transition | Guard |
| --- | --- |
| DRAFT → REVIEW | Template must have name, description, category, ≥1 command |
| REVIEW → PUBLISHED | Only ADMIN or SUPER_ADMIN |
| REVIEW → DRAFT | Only ADMIN or SUPER_ADMIN; rejection reason required |
| PUBLISHED → ARCHIVED | Owner or ADMIN |
| ARCHIVED → DRAFT | Owner only; starts new review cycle |

### Decision

Implement as a pure function in `services/lifecycle.service.ts` with typed
transition guards. No external state machine library.

---

## Research Topic 3: Versioning Strategy

### Question

How should immutable version snapshots be created and managed?

### Investigation

**Sources Checked**:
1. Semantic versioning specification (semver.org)
2. PostgreSQL copy-on-write patterns
3. npm/pnpm package versioning patterns

### Findings

**Recommended Approach**: Create a `TemplateVersion` table that stores a full
snapshot of the template at publish time.

**Version numbering**:
- First publish: `1.0.0`
- Content-only changes: bump PATCH (`1.0.1`)
- New features (commands/forms added): bump MINOR (`1.1.0`)
- Breaking changes (removed commands, changed structure): bump MAJOR (`2.0.0`)
- Author specifies bump type during publish; system suggests based on diff.

**Snapshot strategy**:
- On REVIEW → PUBLISHED transition, copy `content` JSONB and `metadata` into
  a new `TemplateVersion` row.
- The version row is immutable after creation.
- The `Template` row always reflects the latest draft state.
- Active users reference a specific `TemplateVersion.id`.

### Decision

Separate `TemplateVersion` table with full JSONB content snapshot. Author
chooses version bump type. System auto-suggests based on content diff.

---

## Research Topic 4: Search Integration

### Question

How should `@tempot/search-engine` be integrated for template discovery?

### Investigation

**Sources Checked**:
1. `@tempot/search-engine` package source and contracts
2. PostgreSQL full-text search (tsvector/tsquery)
3. Existing search patterns in user-management

### Findings

**`@tempot/search-engine` provides**:
- Typed search plan definitions
- Cache-backed state snapshots
- Pagination metadata
- Adapter-driven semantic planning

**Integration points**:
1. **Search plan adapter**: Define `TemplateSearchPlan` with fields:
   name, description, category, tags, author, status.
2. **Filter support**: category, tags, status, author, rating range.
3. **Sort options**: relevance, rating, usage count, created date, updated date.
4. **Pagination**: 10 items per page default via `@tempot/settings`.

**Full-text search**: Use PostgreSQL tsvector on `name` and `description`
columns for text relevance ranking, combined with relational filters.

### Decision

Create a `TemplateSearchAdapter` that implements the `search-engine` search
plan interface. Combine PostgreSQL tsvector for text search with relational
filters for categories/tags/status.

---

## Research Topic 5: Import/Export Bundle Format

### Question

What should the JSON bundle format look like, and how should PDF export work?

### Investigation

**Sources Checked**:
1. `@tempot/document-engine` export contracts
2. `@tempot/import-engine` parsing and validation contracts
3. JSON Schema specification for bundle validation

### Findings

**JSON Bundle format**:
```json
{
  "$schema": "tempot-template-bundle/1.0",
  "metadata": {
    "name": "E-Commerce Bot",
    "description": "...",
    "category": "e-commerce",
    "tags": ["shop", "payments"],
    "language": "ar",
    "version": "1.2.0"
  },
  "content": {
    "commands": [...],
    "messages": [...],
    "inputForms": [...],
    "permissions": [...],
    "settings": [...]
  },
  "exportedAt": "2026-05-10T00:00:00Z",
  "exportedBy": "author-id",
  "tempotVersion": "1.0.0"
}
```

**Import flow via `import-engine`**:
1. Parse JSON file
2. Validate against Zod schema
3. Check for missing categories/tags — auto-create if needed
4. Create DRAFT template with `clonedFrom: null` (imported, not cloned)

**PDF export via `document-engine`**:
- Uses existing PDF generation contracts
- Sections: metadata, commands list, messages, version history, author info
- Bilingual layout (Arabic RTL + English LTR)

### Decision

JSON bundle with `$schema` field for version detection. PDF via
`document-engine` typed export request. Import via `import-engine` schema
validation adapter.

---

## Research Topic 6: Notification and Subscription Model

### Question

How should template subscriptions and notification delivery work?

### Investigation

**Sources Checked**:
1. `@tempot/notifier` contracts — queue producer, delivery processor
2. `@tempot/event-bus` patterns
3. Existing notification patterns in the project

### Findings

**Subscription model**: A `TemplateSubscription` table linking user and
template. Created on "clone" (activation) or explicit "follow" action.

**Notification triggers**:
| Event | Recipients | Channel |
| --- | --- | --- |
| New version published | All subscribers of that template | Telegram via `notifier` |
| Template pending review | Admins with review permission | Telegram via `notifier` |
| Template status changed | Template owner | Telegram via `notifier` |

**Flow**:
1. Lifecycle service emits event via `event-bus`
2. Notification handler listens for template events
3. Handler queries subscribers from `TemplateSubscription`
4. Handler enqueues notification via `notifier` queue producer

### Decision

`TemplateSubscription` table + event-driven notifications via `event-bus` →
`notifier`. Subscriptions auto-created on clone; explicit follow/unfollow for
browsed templates.

---

## Summary of Decisions

| Topic | Decision |
| --- | --- |
| Content storage | JSONB with Zod validation |
| Lifecycle | Pure function state machine, no external library |
| Versioning | Separate table with full JSONB snapshot |
| Search | `search-engine` adapter + PostgreSQL tsvector |
| Import/Export | JSON bundle + PDF via `document-engine` / `import-engine` |
| Notifications | `TemplateSubscription` table + `event-bus` → `notifier` |
