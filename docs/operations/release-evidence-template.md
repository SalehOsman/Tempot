# Production Release Evidence Template

Use this template for staging and production release records. A production go
decision is invalid until all required evidence is attached or an explicit
dated exception is approved.

## Release Identity

- **Release:** `<version-or-release-name>`
- **Spec:** `<spec-id>`
- **Git commit:** `<sha>`
- **Image digest:** `<registry/image@sha256:...>`
- **Environment:** `<staging | production>`
- **Date:** `<yyyy-mm-dd>`
- **Operator:** `<name>`

## Build and Supply Chain Evidence

- [ ] Frozen lockfile install passed.
- [ ] Lint passed.
- [ ] Build passed.
- [ ] Unit tests passed.
- [ ] Integration and e2e tests passed.
- [ ] Coverage policy passed.
- [ ] `pnpm spec:validate` passed.
- [ ] `pnpm cms:check` passed.
- [ ] Dependency audit has zero unapproved runtime findings.
- [ ] Container image scan has zero unapproved findings.
- [ ] SBOM generated and stored.
- [ ] Provenance generated and verified.
- [ ] Image signature generated and verified.
- [ ] Runtime image contents match the runtime manifest.

## Staging Evidence

- [ ] Same immutable digest deployed to staging.
- [ ] Migration compatibility decision attached.
- [ ] Staging migration passed.
- [ ] Public liveness smoke passed.
- [ ] Restricted readiness smoke passed.
- [ ] Webhook smoke passed.
- [ ] `pnpm smoke:staging:webhook` evidence stored under `docs/operations/evidence/`.
- [ ] Graceful shutdown smoke passed.
- [ ] Metrics visible.
- [ ] Alert path tested.
- [ ] Backup restore rehearsal passed.
- [ ] Rollback or forward-fix rehearsal passed.

## Production Go/No-Go

- **Decision:** `<go | no-go>`
- **Approver:** `<name>`
- **Reason:** `<short rationale>`
- **Open exceptions:** `<none-or-list>`
- **Rollback or forward-fix owner:** `<name>`
- **Post-release verification deadline:** `<timestamp>`
