# ADR-045: Runtime Manifest and Signed Bot Image

## Status

Accepted

## Context

The bot-server production image previously copied workspace `packages/`,
`modules/`, and `specs/` trees into the runner stage so module validation could
inspect source files and SpecKit artifacts at startup. That kept runtime
validation simple, but it expanded the production image attack surface and
conflicted with Spec #057 requirements for a minimal verifiable artifact.

The release workflow also pushed images without SBOM, provenance, image scan,
or signature evidence, so an image publication was not equivalent to a
controlled production release artifact.

## Decision

Tempot will validate module source, package availability, and matching SpecKit
artifacts at build time, then emit `runtime/runtime-manifest.json` for the
runner image.

In production, `ModuleValidator` consumes the runtime manifest when it exists
and no longer requires full source, tests, or SpecKit trees inside the runner.
Development keeps the existing filesystem validation path when no runtime
manifest exists.

The bot-server Docker runner copies only compiled bot output, production
dependencies, the generated runtime manifest, compiled module artifacts, module
locale catalogs, selected runtime database metadata, and package runtime
outputs. It remains non-root.

The Docker workflow builds with BuildKit SBOM and provenance enabled, scans the
immutable digest with Trivy, signs the digest with keyless Cosign, and verifies
the signature before the workflow can complete.

## Consequences

- The production image no longer needs full `specs/`, module source trees,
  module tests, or full package source trees.
- Module validation remains strict in development and CI because the manifest
  generator fails before image assembly when required source/spec/package inputs
  are missing.
- Runtime image publication is blocked by high or critical Trivy findings and
  by failed signature verification.
- Final production approval still requires staging promotion, backup/restore,
  rollback or forward-fix rehearsal, and go/no-go evidence.

## Alternatives Rejected

- **Keep copying `specs/` and source into the runner**: rejected because it keeps
  unnecessary source and governance artifacts in production.
- **Disable module validation in production**: rejected because runtime should
  still fail closed when built metadata is inconsistent.
- **Use image tags for promotion identity**: rejected because mutable tags do
  not prove the same artifact moved between stages.
- **Make supply-chain evidence advisory-only**: rejected because release
  publication must fail on missing or failing evidence.
