# Spec #036: Module Development Platform

## Status

Documentation and methodology specification.

## Problem Statement

Tempot now has the core packages needed to build production modules, but module
creation still relies on scattered guidance. Developers need a single catalog
that explains how to choose module boundaries, select package capabilities,
apply a fixed SpecKit and Superpowers workflow, and prepare future generator and
RAG assistant improvements.

## Goals

- Document a professional module creation methodology.
- Document the agreed baseline module roadmap.
- Document package capabilities available to current and future modules.
- Document blueprint and capability-pack concepts for easier module creation.
- Document the Module Builder RAG Assistant concept without implementing it yet.
- Keep the guidance aligned with existing Tempot gates and role constraints.

## Non-Goals

- No production module is created by this spec.
- No CLI generator change is implemented by this spec.
- No RAG runtime is implemented by this spec.
- No dashboard, SaaS, billing, or tenant behavior is introduced by this spec.

## Functional Requirements

- FR-001: The project MUST provide a central module development catalog for
  developers and agents.
- FR-002: The catalog MUST define when work belongs in a module, package, app,
  or future SaaS layer.
- FR-003: The catalog MUST document the agreed baseline modules:
  `user-management`, `template-management`, `bot-management`,
  `content-management`, `notification-center`, `audit-viewer`, and
  `settings-management`.
- FR-004: The catalog MUST map reusable package capabilities to module use
  cases.
- FR-005: The catalog MUST define standard module structure and lifecycle gates.
- FR-006: The catalog MUST document blueprints and capability packs that reduce
  manual module code.
- FR-007: The catalog MUST document a future module manifest direction.
- FR-008: The catalog MUST document Module Doctor and readiness score concepts.
- FR-009: The catalog MUST document a RAG assistant concept based on `ai-core`
  and grounded project sources.
- FR-010: Existing developer docs MUST link to the new catalog where module
  creation guidance already exists.
- FR-011: Roadmap MUST reflect that module methodology documentation is part of
  Phase 3B preparation.

## Acceptance Criteria

- SC-001: A developer can identify the correct package capability for auth,
  events, persistence, i18n, CMS, settings, notifications, search, import,
  export, AI, storage, Telegram UX, and module metadata.
- SC-002: A developer can follow the documented module lifecycle from product
  decision through PR merge.
- SC-003: A developer can distinguish baseline, operational, product,
  integration, and example/reference module types.
- SC-004: A developer can understand the future RAG assistant boundaries,
  sources, allowed outputs, prohibited outputs, and evaluation requirements.
- SC-005: `pnpm spec:validate` passes for this documentation spec.

## Edge Cases

- A feature that looks like a module but is shared infrastructure must be routed
  to `packages/`.
- A feature that looks like a module but is interface-specific must be routed to
  `apps/`.
- A module needing another module's data must use events or package contracts,
  not direct module imports.
- A module with no approved SpecKit artifacts must not be implemented.
- The RAG assistant must report no-context instead of inventing methodology.
