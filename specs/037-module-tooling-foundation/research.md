# Research: Module Tooling Foundation

## Decision: Implement Module Doctor Before RAG

Module doctor is the first implementation slice.

Rationale: It turns the module catalog into deterministic local checks. RAG can
later use the same catalog and doctor output, but AI guidance should not be the
first enforcement mechanism.

## Decision: Keep Generator Blueprint Support Minimal

Only `basic` is implemented in this spec.

Rationale: The catalog includes many future blueprints, but implementing them
all would create a large, risky feature. The first slice proves the flag shape,
manifest generation, and validation behavior without generating incomplete
business logic.

## Decision: Generate Manifest as Documentation-Oriented Metadata

`module.manifest.ts` starts as a typed local metadata file generated for new
modules. It is not yet consumed by runtime code.

Rationale: This avoids coupling runtime behavior to a new contract before the
manifest stabilizes. The manifest can later feed generator, doctor, README, and
RAG assistant behavior.

## Decision: Use Existing CLI Structure

Extend `scripts/tempot` rather than adding a separate command family.

Rationale: The project already has `pnpm tempot module create`. Adding
`pnpm tempot module doctor` preserves discoverability and keeps module tooling
in one CLI.

## Rejected Option: Implement RAG Assistant Now

Rejected for this spec.

Rationale: RAG needs stable sources, evaluation fixtures, and a clear product
surface. Spec #037 should first establish deterministic local tooling.

## Rejected Option: Delete `test-module` Now

Rejected for this spec.

Rationale: Removing fixtures can affect validation and docs. It deserves a
separate cleanup spec after module tooling can inspect modules reliably.
