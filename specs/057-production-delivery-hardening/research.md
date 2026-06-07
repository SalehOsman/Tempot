# Research: Production Delivery Hardening

## Decision 1: Explicit Startup Stage Orchestrator

**Decision**: Model mandatory and optional startup stages explicitly, validate
every result, and activate readiness only after mandatory completion.

**Rationale**: A positional `Promise.all` can ignore initializer output and
allow rejection outside the declared Result contract.

## Decision 2: Separate Liveness and Readiness

**Decision**: Public liveness reports only process availability. Restricted
readiness reports dependency status and safe diagnostics.

**Rationale**: Detailed public health leaks internal topology and errors, while
container liveness must remain cheap and reliable.

**Alternatives considered**:

- **One detailed public endpoint**: Rejected due to disclosure.
- **One expensive liveness endpoint**: Rejected because dependency failure can
  cause restart loops.

## Decision 3: Explicit Hono Security Baseline

**Decision**: Apply secure headers, body limits, HTTP rate limiting, explicit
CORS policy, stable error responses, and trusted proxy rules before routes.

**Rationale**: Security must be default and route-independent.

## Decision 4: Upgrade Runtime Advisories Before Release

**Decision**: Upgrade confirmed affected dependency paths and document
exploitability only when a fixed version cannot be adopted immediately.

**Rationale**: Hono is production-reachable and Moderate advisories should not
be normalized in the baseline template.

## Decision 5: Build-Time Runtime Manifest

**Decision**: Run module/spec validation in the builder and emit a minimal
runtime manifest consumed by the runner.

**Rationale**: Copying full source and SpecKit trees into production increases
image size and attack surface.

## Decision 6: Immutable Signed Artifact Promotion

**Decision**: Build once, identify by digest, generate SBOM/provenance, sign,
scan, deploy the same digest to staging, then promote it.

**Rationale**: Rebuilding between environments breaks artifact identity.

## Decision 7: Expand/Contract Migration Compatibility

**Decision**: Releases classify migrations and prefer backward-compatible
expand/contract changes. Forward-only/destructive changes require a forward-fix
plan and explicit approval.

**Rationale**: `prisma migrate resolve --rolled-back` does not reverse applied
data/schema changes.

## Decision 8: Provider-Neutral Observability Contract

**Decision**: Define required metrics, alerts, and runbooks without mandating a
specific hosted monitoring provider.

**Rationale**: Tempot Core is a self-hosted template and should remain portable.
