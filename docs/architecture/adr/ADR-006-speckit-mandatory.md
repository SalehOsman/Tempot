# ADR-006: SpecKit as Mandatory Development Methodology

**Date:** 2026-03-19
**Status:** Accepted

## Context

AI-assisted development without a structured methodology produces inconsistent, undocumented, and untestable code. Tempot requires a reproducible, auditable development process that works with both Claude Code and Gemini CLI.

## Decision

Use **SpecKit** (github/spec-kit) as the mandatory Spec-Driven Development framework for all features, packages, and modules.

Combined with **superpowers** for the execution phase, this creates an 11-step lifecycle enforced by the Project Constitution.

## Consequences

- No code enters the codebase without an approved `spec.md`
- Every architectural decision is documented before implementation
- TDD is structurally enforced (tests before code)
- Module creation requires an approved `spec.md` before any code is written (Constitution Rule XLVI)
- Consistent documentation across all contributions

## Alternatives Rejected

**Ad-hoc development:** No process guarantees. AI tools produce code that drifts from requirements. Undocumented decisions become technical debt.

**Custom methodology:** High maintenance cost. SpecKit is actively maintained by GitHub and integrates with AI tools natively.
