# Documentation Restructure Plan

**Status:** Proposed implementation plan.
**Scope:** Documentation architecture, navigation, publishing, generated
reference, and AI context. No production runtime behavior changes.
**Last updated:** 2026-05-07.

## Executive Summary

Tempot already has the correct documentation platform decision: Starlight on
Astro with starlight-typedoc. The issue is not the tool choice. The issue is
information architecture drift: active documents, archive files, generated
reference pages, product docs, and AI context are split across several locations
without a strict publishing model.

The professional target is a two-layer documentation system:

1. A published Starlight site for product, developer, architecture, API
   reference, operations, and governance content.
2. A repository-native source-of-truth layer for SpecKit, ADRs, roadmap,
   constitution, and generated AI context.

The Understand Anything graph becomes the official AI onboarding layer. It helps
AI tools and developers understand the project quickly, while the constitution,
roles, SpecKit artifacts, roadmap, ADRs, and source code remain authoritative.

## Current Problems

| Problem                                                                  | Current impact                                                                              | Required correction                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Active docs live under `docs/archive/`                                   | New contributors may treat historical files as current or ignore active compatibility files | Promote active guidance into the Starlight content tree while keeping compatibility pointers |
| `apps/docs` is implemented but underused                                 | The professional documentation site does not reflect the full project methodology           | Make Starlight the primary human-facing documentation portal                                 |
| Generated TypeDoc coverage is incomplete                                 | Newly completed packages are not all represented in API reference navigation                | Update the TypeDoc package list and validate generated reference freshness                   |
| Arabic Starlight labels show encoding damage in config output            | Published navigation can look unprofessional                                                | Repair config text and add a mojibake check for active docs/config                           |
| AI context is newly available but not yet in the documentation lifecycle | AI tools may use stale or unofficial context                                                | Treat `.understand-anything/knowledge-graph.json` as a governed AI context snapshot          |
| Archive and current docs are mixed                                       | Documentation updates risk touching historical execution logs unnecessarily                 | Define archive policy and migration rules before moving files                                |

## Target Information Architecture

```text
docs/
  README.md                         repository documentation map
  ONBOARDING.md                     AI and developer onboarding snapshot
  development/                      current repository-native developer docs
  product/                          source content mirrored or generated for site
  archive/                          active compatibility paths plus history

apps/docs/src/content/docs/
  ar/                               Arabic published docs
  en/                               English published docs
  governance/                       constitution, roles, workflow, roadmap summaries
  architecture/                     architecture overview, ADR index, boundaries
  development/                      contributor workflows, module development, tooling
  operations/                       deployment, security, disaster recovery
  reference/                        generated TypeDoc output
```

## Tooling Strategy

| Need                    | Tool                                      | Status                | Plan                                                     |
| ----------------------- | ----------------------------------------- | --------------------- | -------------------------------------------------------- |
| Published docs          | Astro + Starlight                         | Implemented           | Keep as the official docs platform                       |
| API reference           | starlight-typedoc + TypeDoc               | Implemented           | Expand package coverage and make generation reproducible |
| Documentation freshness | `apps/docs` freshness scripts             | Partially implemented | Wire into root commands and CI                           |
| Frontmatter validation  | `apps/docs` validation scripts            | Implemented locally   | Make blocking for active published pages                 |
| AI onboarding context   | Understand Anything graph                 | Adopted               | Regenerate after broad architecture or module changes    |
| RAG-ready content       | Markdown plus `@tempot/ai-core` ingestion | Planned by ADR-038    | Add a later SpecKit feature for ingestion automation     |

No new documentation framework should be introduced unless a future ADR
supersedes ADR-038.

## Methodology

This restructure must be delivered through SpecKit and Superpowers:

1. Create a new SpecKit feature for documentation platform restructure.
2. Clarify audiences: product users, module developers, operators, AI agents,
   and maintainers.
3. Produce `spec.md`, `plan.md`, `research.md`, `data-model.md`, and
   `tasks.md`.
4. Run `speckit-analyze` and `pnpm spec:validate` before implementation.
5. Execute documentation migrations in small batches through Superpowers.
6. Validate Starlight build, docs freshness, frontmatter, links, lint, and
   spec reconciliation.

## Phase Plan

### Phase 1: Documentation Inventory and Classification

Classify every active documentation file as one of:

- authoritative source;
- published guide;
- generated reference;
- compatibility pointer;
- historical archive;
- deprecated or duplicate.

Deliverables:

- documentation inventory table;
- migration decision for each active file;
- list of files that must not be edited because they are historical records.

Acceptance criteria:

- No active source document is missing from the inventory.
- Historical archive files are clearly separated from active documentation.
- AI context files are listed as generated governed artifacts.

### Phase 2: Starlight Navigation and Content Model

Define the published site structure and frontmatter model.

Recommended top-level Starlight sections:

- Start Here
- Governance
- Architecture
- Development
- Modules
- Packages
- Operations
- API Reference
- AI Context

Acceptance criteria:

- Arabic and English landing pages exist.
- Sidebar labels render correctly without mojibake.
- Active pages have validated frontmatter.
- Generated reference pages remain generated and are not edited manually.

### Phase 3: Active Guide Promotion

Move or mirror active guidance from compatibility archive paths into the
published Starlight tree.

Priority content:

1. workflow guide;
2. module development catalog;
3. package creation checklist;
4. boundary and architecture guides;
5. security baseline;
6. project knowledge graph summary;
7. onboarding guide.

Acceptance criteria:

- Compatibility paths still exist or redirect by pointer.
- Published pages link back to authoritative source files when appropriate.
- Duplicate active guidance is removed or replaced by canonical pointers.

### Phase 4: API Reference Expansion

Update TypeDoc generation to include all completed public packages.

Packages currently requiring review for inclusion include:

- `cms-engine`
- `search-engine`
- `document-engine`
- `import-engine`
- `notifier`

Acceptance criteria:

- Starlight API reference contains all completed packages with public exports.
- Generated reference is reproducible from source.
- Manual edits to generated reference remain prohibited.

### Phase 5: Documentation Quality Gates

Promote manual documentation checks into automated gates.

Required checks:

- Starlight build;
- frontmatter validation;
- docs freshness;
- active internal link validation;
- mojibake scan for active docs and Starlight config;
- generated graph quality check with non-zero edges;
- `pnpm spec:validate`.

Acceptance criteria:

- Root scripts expose documentation gates.
- CI can run the documentation gates without local-only assumptions.
- Historical archive exclusions are explicit.

### Phase 6: AI Context and RAG Readiness

Use the knowledge graph as the first AI context layer, then prepare RAG
ingestion as a separate feature.

Deliverables:

- documented graph refresh workflow;
- graph quality thresholds;
- AI onboarding page in Starlight;
- later SpecKit feature for `@tempot/ai-core` documentation ingestion.

Acceptance criteria:

- AI tools can start from `docs/ONBOARDING.md` and the graph JSON.
- The graph is regenerated after broad structural changes.
- RAG ingestion is not implemented until its own SpecKit feature exists.

## Proposed SpecKit Feature

Recommended feature name:

```text
038-documentation-platform-restructure
```

Feature goal:

```text
Restructure Tempot documentation into a professional Starlight-first
documentation system with governed source-of-truth mapping, generated API
reference coverage, AI context graph adoption, and automated documentation
quality gates.
```

## Initial Executor Scope

The first implementation batch should be documentation-only:

- repair Starlight navigation labels and content organization;
- add published AI Context and Start Here pages;
- add source-of-truth pointers rather than moving historical files;
- expand TypeDoc package coverage only after confirming package public exports;
- add documentation checks before large content migration.

Do not start production dashboard, module, or runtime changes inside this
documentation restructure.

## Risks

| Risk                                             | Mitigation                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Moving active archive files breaks references    | Use pointer pages first, then update references in controlled batches |
| Generated reference creates noisy diffs          | Keep generated reference isolated and reproducible                    |
| AI graph becomes stale                           | Add freshness policy and quality thresholds                           |
| Arabic and English docs drift                    | Define which pages require bilingual parity and validate frontmatter  |
| Documentation work expands into product redesign | Keep the first SpecKit scope documentation-only                       |

## Recommended Next Step

Start SpecKit feature `038-documentation-platform-restructure` before moving or
rewriting large documentation areas. The current branch only records the
adoption decision and the professional restructure plan.
