# Archived and Legacy Documentation

This directory keeps historical records and compatibility paths for Tempot
documentation.

> Last inventory: 2026-05-07 - Spec #038 task T007/T023.

## Current Policy

Tempot now uses `docs/` as the canonical documentation area for active
architecture, governance support, developer, operations, security, legal, guide,
and asset documents. The old `docs/archive/...` paths remain available only as
compatibility pointers when they were migrated to canonical locations.

Do not add new active guidance under `docs/archive/`. Add active documentation
to the canonical area listed below, then keep or update an archive pointer only
when older specs, plans, prompts, or external references still use the legacy
path.

## Classification Legend

| Label | Meaning | Edit Policy |
| ----- | ------- | ----------- |
| **Canonical Source** | Active document outside `docs/archive/` | Update when project guidance changes |
| **Compatibility Pointer** | Legacy archive path that points to a canonical source | Do not add content; update target if it moves |
| **Historical Archive** | Past execution log, old plan, or superseded document | Keep stable; fix only broken links or encoding damage |

## Canonical Active Locations

| Area | Canonical Path |
| ---- | -------------- |
| Roadmap | `docs/ROADMAP.md` |
| Architecture spec | `docs/architecture/tempot_v11_final.md` |
| ADR index and ADRs | `docs/architecture/adr/` |
| Boundary architecture docs | `docs/architecture/boundaries/` |
| Architecture methodology and SaaS docs | `docs/architecture/` |
| Developer workflow and checklists | `docs/developer/` |
| Operational guides | `docs/operations/` |
| Security guides | `docs/security/` |
| User and UX guides | `docs/guides/` |
| Legal references | `docs/legal/` |
| Project assets | `docs/assets/` |
| AI onboarding map | `docs/ONBOARDING.md` and `docs/developer/project-knowledge-graph.md` |

## Compatibility Pointers

The following legacy archive areas contain pointer files for migrated documents:

| Legacy Area | Canonical Target |
| ----------- | ---------------- |
| `docs/archive/ROADMAP.md` | `docs/ROADMAP.md` |
| `docs/archive/tempot_v11_final.md` | `docs/architecture/tempot_v11_final.md` |
| `docs/archive/architecture/adr/` | `docs/architecture/adr/` |
| `docs/archive/architecture/boundaries/` | `docs/architecture/boundaries/` |
| `docs/archive/developer/` active guides | `docs/developer/` |
| `docs/archive/guides/` | `docs/guides/` |
| `docs/archive/legal/` | `docs/legal/` |
| `docs/archive/operations/` | `docs/operations/` |
| `docs/archive/security/` | `docs/security/` |
| `docs/archive/Tempot_Logo*.png` | `docs/assets/Tempot_Logo*.png` |

These files exist so historical SpecKit artifacts, execution logs, prompts, and
older AI context can still resolve. They are not the current source of truth.

## Historical Archive

These areas remain historical and should not be promoted or rewritten without a
new SpecKit decision:

| Area | Classification | Notes |
| ---- | -------------- | ----- |
| `docs/archive/QUICK-START.md` | Historical Archive | Superseded by `docs/README.md`, `docs/ONBOARDING.md`, and `docs/ROADMAP.md` |
| `docs/archive/deployment/` | Historical Archive | Cloud deployment material is not an active Phase 5 implementation plan |
| `docs/archive/developer/CHAT-ONBOARDING.md` | Historical Archive | Superseded by `docs/ONBOARDING.md` |
| `docs/archive/developer/commands-reference.md` | Historical Archive | Legacy command reference |
| `docs/archive/developer/ecosystem-reference.md` | Historical Archive | Legacy ecosystem reference |
| `docs/archive/developer/module-generator-plan.md` | Historical Archive | Implemented through Spec #037; use `docs/developer/` active guides |
| `docs/archive/developer/template-usability-roadmap.md` | Historical Archive | Superseded by module tooling and roadmap entries |
| `docs/archive/architecture/observability-dashboard.md` | Historical Archive | Future dashboard idea, not active implementation |
| `docs/archive/architecture/review-findings-remediation.md` | Historical Archive | Past review findings tracker |
| `docs/archive/superpowers/plans/` | Historical Archive | Past execution plans |
| `docs/archive/superpowers/specs/` | Historical Archive | Past Superpowers design specs |

## Navigation

- Documentation map: `docs/README.md`
- Development docs: `docs/development/README.md`
- Product docs: `docs/product/README.md`
- Published docs: `apps/docs/src/content/docs/`
