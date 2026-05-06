# Research: Module Development Platform

## Decision: Central Catalog

Use a single central catalog instead of many small disconnected documents.

Rationale: Module creation requires boundary rules, package capability mapping,
workflow gates, generator direction, and AI guidance. A central catalog gives
developers one entry point while existing documents keep their narrow roles.

## Decision: Documentation First

Document blueprints, capability packs, Module Doctor, readiness scoring, and the
RAG assistant before implementing tooling.

Rationale: Tooling should encode stable methodology. Implementing generators or
RAG before the catalog would make code the source of truth instead of SpecKit
and developer documentation.

## Decision: RAG Assistant as Future Helper

The RAG assistant is documented as a future developer helper using `ai-core`.

Rationale: `ai-core` already has retrieval planning, grounding, and evaluation
fixtures. A module assistant can reuse those contracts, but it must first have
authoritative module documentation to retrieve from.

## Decision: Baseline Modules

Document the agreed baseline modules as roadmap direction, not as implemented
features.

Rationale: The Product Manager approved the baseline module set, but each module
still requires its own SpecKit artifacts and Superpowers execution.
