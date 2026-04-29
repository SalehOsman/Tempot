# Archived and Legacy Documentation

This directory keeps historical records and compatibility paths for Tempot
documentation.

## Important Distinction

Some files in this directory are still active sources of truth because the
project constitution, SpecKit artifacts, and AI context files reference their
stable paths:

- `docs/archive/ROADMAP.md`
- `docs/archive/tempot_v11_final.md`
- `docs/archive/developer/workflow-guide.md`
- `docs/archive/developer/package-creation-checklist.md`
- `docs/archive/architecture/adr/README.md`
- `docs/archive/security/security-baseline.md`

Other files are historical execution artifacts. They should not be used as
current implementation instructions unless an active document explicitly says so.

## Edit Policy

- Active compatibility-path documents may be edited when they are the current
  source of truth.
- Historical plans, old readiness reports, and old Superpowers execution logs
  should remain stable unless a cleanup task explicitly targets stale links or
  encoding damage.
- New documentation should normally start from `docs/README.md`,
  `docs/development/`, or `docs/product/` rather than adding more root-level
  archive files.

## Navigation

- Documentation map: `docs/README.md`
- Development docs: `docs/development/README.md`
- Product docs: `docs/product/README.md`
