# Bot Management Module - Technical Research

**Feature:** 040-bot-management
**Source:** spec.md
**Generated:** 2026-05-12

---

## Overview

`bot-management` is an operational platform module. It coordinates existing
Tempot capabilities around a managed bot record without becoming a runtime
orchestration layer. The key research concern is how to reuse existing packages
professionally while preserving module boundaries and avoiding premature SaaS
scope.

---

## Research Topic 1: Module Boundary and Ownership

### Question

Should `bot-management` be a module, a shared package, or an app concern?

### Decision

Implement `bot-management` as a business module under `modules/`.

### Rationale

The feature owns operational domain behavior: bot registry, lifecycle,
settings, module enablement, provisioning attribution, health snapshots, and
admin flows. These are product behaviors, not generic infrastructure. Shared
packages already provide the reusable services this module consumes.

### Alternatives Considered

- **New package**: Rejected because no reusable infrastructure is being created.
- **Bot-server app code**: Rejected because app code should expose runtime
  interfaces, not own domain workflows.
- **Template-management extension**: Rejected because bot operations are a
  distinct operational domain.

---

## Research Topic 2: Runtime Control Boundary

### Question

Should the module start, stop, or reconfigure running bot processes directly?

### Decision

No. The module records governed operational state and emits events. Runtime
process control remains outside this module.

### Rationale

Direct runtime control would couple module code to `apps/bot-server` process
internals and create unsafe failure modes. The current phase needs a reliable
control plane record, not process orchestration. A later runtime contract can
consume bot-management events when approved.

### Alternatives Considered

- **Direct webhook and process updates**: Rejected as too broad and risky for
  this spec.
- **Runtime adapter inside the module**: Rejected because it would violate clear
  app/module boundaries.

---

## Research Topic 3: Credential Safety

### Question

How should bot credentials be represented without exposing secrets?

### Decision

Represent sensitive credentials through redacted display values, setup state,
and stable fingerprints. Exported profiles must omit raw secrets and record
required setup steps instead.

### Rationale

The constitution requires secure handling of API keys and sensitive fields.
`bot-management` needs to verify uniqueness and setup completeness, but normal
admin views and exports do not need raw tokens.

### Alternatives Considered

- **Store and display raw token**: Rejected for security reasons.
- **Exclude credentials entirely**: Rejected because setup completeness and
  duplicate detection require credential state.

---

## Research Topic 4: Per-Bot Module Enablement

### Question

How should modules be enabled or blocked per managed bot?

### Decision

Use an explicit `BotModuleEnablement` entity with states:
`ENABLED`, `DISABLED`, `UNAVAILABLE`, and `BLOCKED`.

### Rationale

Admins need to distinguish "not selected" from "cannot be selected". A blocked
state gives actionable feedback when a template or bot profile requires a module
that is not ready.

### Alternatives Considered

- **Boolean enabled flag only**: Rejected because it hides missing requirements.
- **Derived-only state from module registry**: Rejected because per-bot choices
  and reasons need persistence.

---

## Research Topic 5: Template Provisioning Relationship

### Question

How should bot profiles created from templates reference template data?

### Decision

Store source template ID, version ID, source name snapshot, and provisioning
timestamp in a `BotTemplateSource` entity. Do not auto-upgrade bot profiles when
the template changes.

### Rationale

The relationship gives traceability while preserving operational stability.
Auto-upgrade would be a separate workflow with its own review, risk, and rollback
requirements.

### Alternatives Considered

- **Copy template data with no attribution**: Rejected because it loses
  provenance.
- **Always track latest template version**: Rejected because it can change bot
  behavior without admin approval.

---

## Research Topic 6: Import and Export Profile Format

### Question

What should import/export preserve?

### Decision

Preserve non-sensitive profile metadata, settings, enabled/blocked modules,
template source attribution, lifecycle state as import metadata, and health
summary. Imported profiles always enter `DRAFT`.

### Rationale

Export supports review, backup, and migration. Import into `DRAFT` prevents
unsafe activation and forces admin review in the target instance.

### Alternatives Considered

- **Import directly into ACTIVE**: Rejected as unsafe.
- **Export raw credentials**: Rejected for security reasons.

---

## Research Topic 7: Search and Operational Views

### Question

How should admins find managed bots at scale?

### Decision

Use typed search/filter contracts and paginated state snapshots over bot name,
username, owner, lifecycle status, runtime mode, template source, and enabled
module.

### Rationale

Search is an existing Tempot capability and avoids ad hoc filter builders. The
feature's 1,000-bot target needs indexed queries and predictable pagination.

### Alternatives Considered

- **Manual in-memory filtering**: Rejected because it will not scale and bypasses
  existing search conventions.
- **External search service**: Rejected as unnecessary for the MVP scale.

---

## Summary of Decisions

| Topic | Decision |
| --- | --- |
| Ownership | Business module under `modules/bot-management` |
| Runtime control | Record state and emit events only |
| Credentials | Redacted values, fingerprints, and setup state |
| Module enablement | Explicit per-bot state with blocked reasons |
| Template provisioning | Preserve source template/version attribution |
| Import/export | Portable non-sensitive profile; import into `DRAFT` |
| Search | Reuse typed search/filter capability with pagination |
