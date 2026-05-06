# Tasks: Module Tooling Foundation

## SpecKit Handoff

- [x] T001 Create Spec #037 artifacts for module tooling foundation - covers
  FR-001 through FR-014, SC-001 through SC-006
- [x] T002 Update active feature metadata and Roadmap to identify Spec #037 as
  active module tooling work - covers FR-014, SC-006
- [x] T003 Run `pnpm spec:validate` and resolve all critical/high findings -
  covers SC-006

## TDD: CLI Parser

- [x] T004 Write failing parser tests for `module doctor <module-name>` - covers
  FR-001, SC-001
- [x] T005 Write failing parser tests for `module create` `--type` and
  `--blueprint basic` - covers FR-009, FR-010, SC-002
- [x] T006 Write failing parser/generator tests for unsupported blueprint
  rejection - covers FR-011, SC-003
- [x] T007 Implement parser and validation changes minimally - covers FR-001,
  FR-009, FR-010, FR-011

## TDD: Module Doctor

- [x] T008 Write failing tests for module doctor pass/fail/missing module
  checks - covers FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, SC-001
- [x] T009 Implement module doctor types, checks, and presenter - covers FR-002,
  FR-003, FR-004, FR-005, FR-006, FR-007
- [x] T010 Wire `pnpm tempot module doctor <module-name>` into CLI entrypoint -
  covers FR-001, FR-002, FR-003

## TDD: Generator Manifest

- [x] T011 Write failing generator tests for `module.manifest.ts` and manifest
  test generation - covers FR-012, FR-013, SC-004
- [x] T012 Implement manifest generation for the basic blueprint - covers
  FR-012, FR-013
- [x] T013 Preserve default module create behavior and existing output - covers
  FR-008

## Documentation Sync

- [x] T014 Update module catalog, generator plan, checklist, and Roadmap with
  implemented tooling behavior - covers FR-014
- [x] T015 Re-run `pnpm spec:validate` after documentation sync - covers SC-006

## Verification

- [x] T016 Run targeted `scripts/tempot` unit tests - covers SC-001 through
  SC-004
- [x] T017 Run `pnpm test:unit`, `pnpm boundary:audit`,
  `pnpm module:checklist`, `pnpm cms:check`, and `git diff --check` - covers
  SC-005, SC-006
- [x] T018 Run `pnpm build` if TypeScript graph or generated template changes
  indicate typecheck risk - covers SC-005
