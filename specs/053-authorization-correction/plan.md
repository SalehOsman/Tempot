# Implementation Plan: Authorization Correction

**Branch**: `codex/053-authorization-correction` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/053-authorization-correction/spec.md`

## Summary

Correct the bot authorization boundary so global middleware authenticates and
constructs actor context while commands, callbacks, conversations, and use
cases enforce explicit action/subject policy. Preserve CASL, the
four-role hierarchy, module ability declarations, security-chain ordering, and
auditable denials. Prove the correction with production-ability role matrices
and zero-mutation denial tests.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode  
**Primary Dependencies**: grammY 1.41.x, CASL 6.x, `@tempot/auth-core`, `@tempot/shared`, module ability declarations  
**Storage**: Existing PostgreSQL user/role data and audit records; no planned schema migration  
**Testing**: Vitest 4.1.0; bot-server unit/integration tests; affected module tests; authorization coverage audit
**Target Platform**: Node.js 22.12+ Telegram bot runtime  
**Project Type**: TypeScript monorepo modular bot application  
**Performance Goals**: Authorization adds no new network round trip per update and remains within existing middleware latency budgets  
**Constraints**: No broad allow fallback; no new role; no hardcoded user text; all fallible public APIs use `Result<T, AppError>`  
**Scale/Scope**: All active bot entry points are inventoried; implementation may be delivered module-by-module after the global correction

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Rule VII / Fix at source**: Correct the global middleware and owning authorization boundaries; do not wrap or bypass the defect.
- **Rules XIII-XV / Architecture**: Preserve interface/service/core boundaries and Event Bus-only module communication.
- **Rule XXI / Result pattern**: Authorization factories and guards retain typed errors.
- **Rules XXV-XXVIII / Security**: Preserve security-chain order, CASL hierarchy, repository checks, and secure bootstrap.
- **Rule XXXIV / TDD**: Production-role tests fail before middleware or handler changes.
- **Rules XXXIX-XL / i18n**: Denial messages remain locale-backed.
- **Rule LIV / Blast radius**: Changes to auth-core or shared context require impact analysis across every consumer.
- **Rule L / Documentation parity**: Update SpecKit artifacts, authorization documentation, roadmap, and affected READMEs.
- **Rules LXXIX-LXXXVI / Methodology**: Complete SpecKit handoff before Superpowers execution.

Initial gate result: PASS. No exception is required.

## Project Structure

### Documentation

```text
specs/053-authorization-correction/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- authorization-enforcement-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Expected Source Scope

```text
apps/bot-server/src/bot/middleware/
apps/bot-server/src/startup/
apps/bot-server/tests/
packages/auth-core/src/
packages/auth-core/tests/
modules/*/abilities.ts
modules/*/handlers/
modules/*/tests/
docs/architecture/
docs/developer/
```

**Structure Decision**: Keep identity/context establishment in bot middleware,
policy definition in auth-core and module abilities, and action enforcement at
the handler/use-case boundary. Preserve existing repository boundaries without
claiming the broader Spec 055 repository remediation in this feature.

## Implementation Phases

### Phase 0 - Policy Inventory and RED Baseline

1. Inventory active commands, callbacks, conversations, and public bootstrap paths.
2. Record the role/action/subject matrix.
3. Add production-ability tests reproducing the current non-super-admin denial.
4. Add denial tests proving zero repository mutation.

### Phase 1 - Global Boundary Correction

1. Refactor middleware to authenticate and attach actor context.
2. Retain explicit handling for missing and disabled actors.
3. Remove the unconditional `manage all` decision.
4. Preserve security-chain order and typed error behavior.

### Phase 2 - Explicit Action Enforcement

1. Audit every active handler/use case in scope.
2. Add missing action/subject checks at the owning boundary.
3. Confirm the correction introduces no repository bypass or direct persistence access.
4. Add localized denial and structured audit evidence.

### Phase 3 - Regression and Governance

1. Complete role-matrix command and callback tests.
2. Add authorization coverage validation.
3. Update architecture and developer documentation.
4. Run review and full relevant gates.

## TDD Strategy

- **RED**: Real ability factory shows USER/ADMIN denied before allowed handlers.
- **GREEN**: Global middleware permits valid actor context and local policy controls access.
- **REFACTOR**: Remove duplicated guard wiring and centralize typed authorization helpers only where existing patterns support it.

No production middleware or handler change may precede its failing test.

## Verification Strategy

- `pnpm --filter bot-server test`
- Affected module test commands
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm lint`
- `pnpm build`
- `pnpm boundary:audit`
- `pnpm cms:check`
- `pnpm spec:validate`

## Post-Design Constitution Check

The design preserves CASL, explicit role hierarchy, existing repository
boundaries, i18n, and TDD. The global correction does not create a broad allow
path. Full repository authorization conformance remains assigned to Spec 055.

Post-design gate result: PASS.

## Complexity Tracking

No constitution violation is introduced.
