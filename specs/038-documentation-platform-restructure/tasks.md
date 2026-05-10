# Tasks: Documentation Platform Restructure

## SpecKit Handoff

- [x] T001 Create Spec #038 artifacts for documentation platform restructure -
      covers FR-001 through FR-012, SC-001 through SC-008
- [x] T002 Record AI knowledge graph adoption in active documentation maps,
      onboarding, Roadmap, and graph workflow - covers FR-001, FR-002, FR-003,
      FR-011, SC-001, SC-002, SC-006, SC-008
- [x] T003 Document the professional restructure plan and target information
      architecture - covers FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, FR-010,
      FR-012, SC-003, SC-008

## User Story 1: Find Current Project Guidance

- [x] T004 [US1] Update `docs/README.md` source-of-truth map after each
      restructure slice - covers FR-001, FR-003, SC-001
- [x] T005 [US1] Update `docs/development/README.md` with current developer and
      AI context entry points - covers FR-001, FR-002, FR-003, SC-001, SC-002
- [x] T006 [US1] Add or update Starlight Start Here pages that point to active
      repository sources - covers FR-004, FR-006, FR-007, SC-001, SC-003
- [x] T007 [US1] Review active archive compatibility paths and document which
      files remain authoritative - covers FR-003, FR-007, SC-001

## User Story 2: Publish Professional Documentation Navigation

- [x] T008 [US2] Repair active Starlight navigation labels and remove encoding
      damage from config-visible labels - covers FR-004, FR-005, SC-004
- [x] T009 [US2] Add Starlight Governance section with pointers to roles,
      constitution, workflow, Roadmap, and SpecKit process - covers FR-004, FR-006,
      FR-007, SC-001, SC-004, SC-005
- [x] T010 [US2] Add Starlight Architecture section with pointers to the
      architecture spec, ADR index, boundaries, and project knowledge graph - covers
      FR-004, FR-006, FR-007, SC-003, SC-004, SC-005
- [x] T011 [US2] Add Starlight Development and Modules sections that expose the
      module catalog, package checklist, module checklist, and tooling guidance -
      covers FR-004, FR-006, FR-007, SC-001, SC-004, SC-005
- [x] T012 [US2] Add Starlight AI Context section that explains graph authority,
      refresh policy, and onboarding use - covers FR-002, FR-004, FR-011, SC-002,
      SC-004, SC-006

## User Story 3: Keep Generated and AI Context Governed

- [x] T013 [US3] Review completed public packages for TypeDoc inclusion and
      update docs configuration only for ready packages - covers FR-008, FR-009,
      SC-004
- [x] T014 [US3] Add or document graph quality validation with meaningful node
      and edge thresholds - covers FR-010, FR-011, SC-006
- [x] T015 [US3] Add active documentation hygiene checks for frontmatter,
      freshness, links, and mojibake - covers FR-005, FR-010, SC-004, SC-005,
      SC-007
- [x] T016 [US3] Keep documentation RAG ingestion scoped to a future SpecKit
      feature - covers FR-012, SC-003

## Verification

- [x] T017 Run `pnpm lint` after documentation and configuration changes -
      covers SC-007
- [x] T018 Run `pnpm spec:validate` after documentation sync - covers SC-007,
      SC-008
- [x] T019 Run `pnpm --filter docs docs:validate` after Starlight content
      changes - covers SC-005
- [x] T020 Run `pnpm --filter docs build` after Starlight navigation,
      configuration, or TypeDoc changes - covers SC-004
- [x] T021 Run graph quality validation after graph or AI context changes -
      covers SC-006
- [x] T022 Run `git diff --check` before commit - covers SC-007

## Dependencies

- T004 through T007 establish repository entry points before broad Starlight
  promotion.
- T008 should happen before final Starlight navigation acceptance.
- T009 through T012 can be implemented as independent published documentation
  sections after T008.
- T013 should be isolated because generated reference can create large diffs.
- T014 and T015 can be implemented independently after the documentation gate
  design is accepted.

## Notes

- Do not edit generated TypeDoc pages manually.
- Do not remove compatibility-path archive pointers until references are
  inventoried and migrated in a later controlled batch.
- Do not implement documentation RAG ingestion in this spec.
- Each implementation slice should commit separately and rerun relevant gates.
