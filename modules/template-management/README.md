# Template Management Module

Bot template CRUD, lifecycle, versioning, search, import/export, ratings, and
notifications for Tempot.

## Purpose

The module allows users to create, version, publish, search, import, and export
bot feature templates. Templates are reusable bot configurations containing
commands, messages, input forms, permissions, and settings. A governed lifecycle
(DRAFT → REVIEW → PUBLISHED → ARCHIVED) ensures quality before publishing.

## Features

- Template CRUD with soft-delete
- Lifecycle state machine (DRAFT → REVIEW → PUBLISHED → ARCHIVED)
- Immutable version snapshots on publish (semver)
- Template cloning (activation) with source link
- Hierarchical categories (max 3 levels) and free-form tags
- Full-text search with category/tag/status/rating filters
- JSON bundle import and export
- PDF documentation export
- 1–5 star ratings with average calculation
- Subscription-based update notifications
- CMS-managed official template descriptions
- Bilingual support (Arabic and English)

## UI/UX

- **Primary**: Inline Keyboards (90%)
- **Secondary**: command shortcuts (10%)
- **Navigation**: hierarchical menu screens with back actions

## Commands

| Command | Description | Access |
| --- | --- | --- |
| `/templates` | Open the template management menu | All users |
| `/new_template` | Start template creation wizard | USER and above |
| `/import_template` | Import a JSON template bundle | USER and above |

## Package Dependencies

| Package | Usage |
| --- | --- |
| `@tempot/database` | Template, version, category, tag, rating, subscription repositories |
| `@tempot/auth-core` | RBAC abilities |
| `@tempot/event-bus` | Lifecycle and activity events |
| `@tempot/search-engine` | Full-text and filtered search |
| `@tempot/import-engine` | JSON bundle import with validation |
| `@tempot/document-engine` | JSON and PDF export |
| `@tempot/cms-engine` | Official template descriptions |
| `@tempot/notifier` | Subscription and review notifications |
| `@tempot/i18n-core` | Bilingual UI text |
| `@tempot/ux-helpers` | Inline keyboards, pagination, confirmation dialogs |
| `@tempot/settings` | Configurable pagination and rate limits |
| `@tempot/module-registry` | Module config and toggle registration |

## Spec

See `specs/039-template-management/` for full SpecKit artifacts.
