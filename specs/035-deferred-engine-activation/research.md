# Research: Deferred Engine Activation

**Feature**: 035-deferred-engine-activation
**Date**: 2026-05-06

## Problem Statement

`search-engine`, `document-engine`, and `import-engine` existed as forward-design packages
under Rule XC. The Product Manager has now decided to build these packages. The project
must record that activation and repair the old SpecKit artifacts before any implementation
worker writes package code.

## Key Design Decisions

### D1: Activate all three packages, execute one at a time

The roadmap records all three packages as activated, but execution remains sequential.
This satisfies the Product Manager decision while preserving Rule LXXXV.

### D2: Implement `document-engine` first

`document-engine` provides the export capability required by `import-engine` error
reports. Building it first reduces dependency risk.

### D3: Implement `import-engine` second

`import-engine` can then consume document export contracts for invalid-row reports while
emitting validated batches to destination modules through the event bus.

### D4: Implement `search-engine` third

`search-engine` should align with the completed `ai-core` RAG contracts and avoid
creating an independent AI path. It has fewer direct dependencies on the first two
packages.

### D5: Keep `.understand-anything/` out of the repo

The local knowledge graph cache may help reviewers, but it is not a project dependency
or CI artifact. A separate DX tooling spec is required before repository integration.

## Alternatives Rejected

### Start coding all three packages immediately

Rejected because Rule LXXXV allows only one package in active execution and the old specs
are missing required handoff artifacts.

### Start with `search-engine`

Rejected for the activation sequence because the import/export path has a clear
dependency chain and provides foundational administrative workflows.

### Keep packages deferred while writing code

Rejected because Rule XC requires activation to be recorded before deferred packages stop
being exempt from validation and become implementation candidates.

## Dependency Research Notes

Package-specific dependency decisions are intentionally kept in each package research
artifact. Implementation workers must verify existing workspace dependencies and any new
dependency request before changing package manifests.
