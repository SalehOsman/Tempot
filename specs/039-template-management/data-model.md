# Template Management Module — Data Model

**Feature:** 039-template-management
**Source:** spec.md + research.md
**Generated:** 2026-05-10

---

## Overview

This module requires **new database tables** for templates, versions,
categories, tags, ratings, and subscriptions. Template content is stored as
JSONB. All tables follow the Tempot soft-delete and audit-column conventions.

---

## Database Schema

### New Tables

```sql
-- Template: core entity
CREATE TABLE templates (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  -- CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'))
  content       JSONB NOT NULL DEFAULT '{}',
  category_id   TEXT REFERENCES categories(id),
  author_id     TEXT NOT NULL,
  cloned_from   TEXT REFERENCES templates(id),
  language      VARCHAR(10) NOT NULL DEFAULT 'ar',
  usage_count   INTEGER NOT NULL DEFAULT 0,
  rating_avg    NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count  INTEGER NOT NULL DEFAULT 0,
  current_version VARCHAR(20),
  is_official   BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  deleted_at    TIMESTAMP,
  deleted_by    TEXT
);

CREATE INDEX idx_templates_status ON templates(status) WHERE NOT is_deleted;
CREATE INDEX idx_templates_author ON templates(author_id) WHERE NOT is_deleted;
CREATE INDEX idx_templates_category ON templates(category_id) WHERE NOT is_deleted;
CREATE INDEX idx_templates_slug ON templates(slug) WHERE NOT is_deleted;
CREATE INDEX idx_templates_rating ON templates(rating_avg DESC) WHERE status = 'PUBLISHED' AND NOT is_deleted;
CREATE INDEX idx_templates_usage ON templates(usage_count DESC) WHERE status = 'PUBLISHED' AND NOT is_deleted;
CREATE INDEX idx_templates_content ON templates USING GIN (content);

-- Full-text search vector
ALTER TABLE templates ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) STORED;
CREATE INDEX idx_templates_search ON templates USING GIN (search_vector);

-- Template Version: immutable snapshot on publish
CREATE TABLE template_versions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   TEXT NOT NULL REFERENCES templates(id),
  version       VARCHAR(20) NOT NULL,
  content       JSONB NOT NULL,
  metadata      JSONB NOT NULL,
  change_summary TEXT,
  published_by  TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, version)
);

CREATE INDEX idx_versions_template ON template_versions(template_id);

-- Category: hierarchical classification (max 3 levels)
CREATE TABLE categories (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar       VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  icon          VARCHAR(10),
  parent_id     TEXT REFERENCES categories(id),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  depth         INTEGER NOT NULL DEFAULT 0,
  -- CHECK (depth <= 2) -- 0, 1, 2 = max 3 levels
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  is_deleted    BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE NOT is_deleted;
CREATE INDEX idx_categories_slug ON categories(slug) WHERE NOT is_deleted;

-- Tag: free-form label
CREATE TABLE tags (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Template-Tag junction
CREATE TABLE template_tags (
  template_id   TEXT NOT NULL REFERENCES templates(id),
  tag_id        TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (template_id, tag_id)
);

CREATE INDEX idx_template_tags_tag ON template_tags(tag_id);

-- Rating: per-user per-template
CREATE TABLE template_ratings (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   TEXT NOT NULL REFERENCES templates(id),
  user_id       TEXT NOT NULL,
  stars         INTEGER NOT NULL,
  -- CHECK (stars >= 1 AND stars <= 5)
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, user_id)
);

CREATE INDEX idx_ratings_template ON template_ratings(template_id);

-- Subscription: user follows a template for updates
CREATE TABLE template_subscriptions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   TEXT NOT NULL REFERENCES templates(id),
  user_id       TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, user_id)
);

CREATE INDEX idx_subscriptions_template ON template_subscriptions(template_id);
CREATE INDEX idx_subscriptions_user ON template_subscriptions(user_id);
```

---

## TypeScript Contracts

### TemplateStatus Enum

```typescript
export const TemplateStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type TemplateStatus = (typeof TemplateStatus)[keyof typeof TemplateStatus];
```

### Template Entity

```typescript
export interface Template {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: TemplateStatus;
  content: TemplateContent;
  categoryId: string | null;
  authorId: string;
  clonedFrom: string | null;
  language: string;
  usageCount: number;
  ratingAvg: number;
  ratingCount: number;
  currentVersion: string | null;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}
```

### TemplateContent (JSONB)

```typescript
export interface TemplateContent {
  commands: TemplateCommandDef[];
  messages: TemplateMessageDef[];
  inputForms?: TemplateInputFormDef[];
  permissions?: TemplatePermissionDef[];
  settings?: TemplateSettingDef[];
}

export interface TemplateCommandDef {
  name: string;
  description: string;
  handler?: string;
}

export interface TemplateMessageDef {
  key: string;
  defaultText: Record<string, string>;
  placeholders?: string[];
}

export interface TemplateInputFormDef {
  name: string;
  steps: TemplateFormStep[];
}

export interface TemplateFormStep {
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  validation?: string;
  options?: string[];
}

export interface TemplatePermissionDef {
  action: string;
  subject: string;
  minRole: string;
}

export interface TemplateSettingDef {
  key: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: unknown;
  description: string;
}
```

### TemplateVersion Entity

```typescript
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: TemplateContent;
  metadata: TemplateVersionMetadata;
  changeSummary: string | null;
  publishedBy: string;
  createdAt: Date;
}

export interface TemplateVersionMetadata {
  name: string;
  description: string;
  categorySlug: string | null;
  tags: string[];
  language: string;
  isOfficial: boolean;
}
```

### Category Entity

```typescript
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

### Tag Entity

```typescript
export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
}
```

### Rating Entity

```typescript
export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Entity

```typescript
export interface TemplateSubscription {
  id: string;
  templateId: string;
  userId: string;
  createdAt: Date;
}
```

---

## Callback Action Namespace

```typescript
export type TemplateAction =
  // Navigation
  | 'tmpl:menu'
  | 'tmpl:browse'
  | 'tmpl:my'
  | 'tmpl:create'

  // Template CRUD
  | `tmpl:view:${string}`
  | `tmpl:edit:${string}`
  | `tmpl:delete:${string}`
  | `tmpl:delete:${string}:confirm`

  // Lifecycle
  | `tmpl:submit:${string}`
  | `tmpl:publish:${string}`
  | `tmpl:reject:${string}`
  | `tmpl:archive:${string}`
  | `tmpl:reactivate:${string}`

  // Versioning
  | `tmpl:versions:${string}`
  | `tmpl:version:${string}:${string}`

  // Clone / Activation
  | `tmpl:clone:${string}`

  // Search and Browse
  | 'tmpl:search'
  | 'tmpl:categories'
  | `tmpl:category:${string}`
  | `tmpl:sort:${string}`

  // Import / Export
  | `tmpl:export:${string}`
  | `tmpl:export:${string}:json`
  | `tmpl:export:${string}:pdf`
  | 'tmpl:import'

  // Categories (admin)
  | 'tmpl:cat:manage'
  | `tmpl:cat:add`
  | `tmpl:cat:edit:${string}`
  | `tmpl:cat:delete:${string}`

  // Tags
  | `tmpl:tags:${string}`

  // Rating
  | `tmpl:rate:${string}`
  | `tmpl:rate:${string}:${string}`

  // Subscription
  | `tmpl:subscribe:${string}`
  | `tmpl:unsubscribe:${string}`

  // Pagination
  | `tmpl:page:${string}`;
```

---

## Event Contracts

```typescript
// Published via @tempot/event-bus

export interface TemplateCreatedEvent {
  templateId: string;
  authorId: string;
  name: string;
  timestamp: Date;
}

export interface TemplateStatusChangedEvent {
  templateId: string;
  oldStatus: TemplateStatus;
  newStatus: TemplateStatus;
  changedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface TemplateVersionPublishedEvent {
  templateId: string;
  versionId: string;
  version: string;
  publishedBy: string;
  timestamp: Date;
}

export interface TemplateDeletedEvent {
  templateId: string;
  deletedBy: string;
  timestamp: Date;
}

export interface TemplateClonedEvent {
  sourceTemplateId: string;
  cloneTemplateId: string;
  userId: string;
  timestamp: Date;
}

export interface TemplateRatedEvent {
  templateId: string;
  userId: string;
  stars: number;
  newAverage: number;
  timestamp: Date;
}
```

---

## Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const templateCommandDefSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z_]+$/),
  description: z.string().min(1).max(255),
  handler: z.string().max(255).optional(),
});

export const templateMessageDefSchema = z.object({
  key: z.string().min(1).max(255),
  defaultText: z.record(z.string(), z.string().min(1)),
  placeholders: z.array(z.string()).optional(),
});

export const templateContentSchema = z.object({
  commands: z.array(templateCommandDefSchema).min(1),
  messages: z.array(templateMessageDefSchema).min(1),
  inputForms: z.array(z.object({
    name: z.string().min(1),
    steps: z.array(z.object({
      field: z.string().min(1),
      type: z.enum(['text', 'number', 'date', 'select', 'boolean']),
      label: z.string().min(1),
      validation: z.string().optional(),
      options: z.array(z.string()).optional(),
    })).min(1),
  })).optional(),
  permissions: z.array(z.object({
    action: z.string().min(1),
    subject: z.string().min(1),
    minRole: z.string().min(1),
  })).optional(),
  settings: z.array(z.object({
    key: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean']),
    defaultValue: z.unknown(),
    description: z.string().min(1),
  })).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  categoryId: z.string().optional(),
  language: z.enum(['ar', 'en']),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const templateBundleSchema = z.object({
  $schema: z.literal('tempot-template-bundle/1.0'),
  metadata: z.object({
    name: z.string().min(1).max(255),
    description: z.string().min(1).max(5000),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    language: z.string(),
    version: z.string(),
  }),
  content: templateContentSchema,
  exportedAt: z.string().datetime(),
  exportedBy: z.string(),
  tempotVersion: z.string(),
});
```

---

## Data Flow Diagrams

### Template Creation Flow

```
User clicks "➕ قالب جديد"
  ↓
Wizard Step 1: name + description (text input)
  ↓
Wizard Step 2: category (Inline Keyboard selection)
  ↓
Wizard Step 3: language (Inline Keyboard: ar/en)
  ↓
Wizard Step 4: tags (text input, comma-separated)
  ↓
Validate via createTemplateSchema
  ↓
TemplateRepository.create({ ...data, status: DRAFT, content: { commands: [], messages: [] } })
  ↓
EventBus.publish('template-management.template.created', event)
  ↓
Display: template detail view with edit options
```

### Lifecycle Transition Flow

```
Author clicks "📤 إرسال للمراجعة"
  ↓
LifecycleService.transition(templateId, REVIEW, userId)
  ↓
Guard: canTransition(DRAFT, REVIEW) → true
  ↓
Guard: isComplete(template) → name + description + category + ≥1 command
  ↓
Repository.updateStatus(templateId, REVIEW)
  ↓
EventBus.publish('template-management.status.changed', event)
  ↓
NotificationHandler → notify admins with review permission
  ↓
Display: "تم إرسال القالب للمراجعة" with status badge
```

### Clone (Activation) Flow

```
User clicks "📋 استخدام هذا القالب"
  ↓
CloneService.clone(templateId, userId)
  ↓
Guard: template.status === PUBLISHED
  ↓
Repository.create({ ...template, status: DRAFT, authorId: userId, clonedFrom: templateId })
  ↓
Repository.incrementUsageCount(templateId)
  ↓
SubscriptionRepository.create(templateId, userId)
  ↓
EventBus.publish('template-management.template.cloned', event)
  ↓
Display: "تم نسخ القالب بنجاح" → redirect to user's template detail
```

### Search Flow

```
User clicks "🔎 بحث"
  ↓
Prompt: enter search text
  ↓
TemplateSearchAdapter.search({ query, filters, sort, page })
  ↓
PostgreSQL: search_vector @@ plainto_tsquery('simple', query)
  + WHERE status = 'PUBLISHED' AND NOT is_deleted
  + JOIN categories, template_tags for filters
  + ORDER BY ts_rank(search_vector, query) / rating_avg / usage_count
  ↓
Pagination via search-engine state snapshot
  ↓
Display: template list with pagination buttons
```

---

## Summary

| Concern | Tables | Key Decision |
| --- | --- | --- |
| Templates | `templates` | JSONB content + relational metadata |
| Versioning | `template_versions` | Immutable JSONB snapshot on publish |
| Categories | `categories` | Hierarchical, max 3 levels, bilingual |
| Tags | `tags`, `template_tags` | Free-form, junction table |
| Ratings | `template_ratings` | Per-user per-template, 1-5 stars |
| Subscriptions | `template_subscriptions` | Auto on clone, manual follow/unfollow |

**Total new tables**: 6 (+ 1 junction table)
**Total new indexes**: 14
**Migration required**: Yes — Prisma migration for all new tables
