# Contract: Developer Experience and Security Baseline

**Feature**: 026-architecture-isolation-and-saas-readiness
**Date**: 2026-04-28

This contract defines documentation outputs for professional template usability, security posture, and review-finding closure. It is not a runtime API.

## Official CLI Contract

The future CLI decision document MUST evaluate:

- `create-tempot-bot` as an npm initializer-style entrypoint
- `pnpm tempot init` as a workspace command entrypoint
- Required generated files for a new bot project
- Required validation commands after initialization
- How the CLI enforces SpecKit and Superpowers methodology

## Governed Module Generator Contract

The module generator plan MUST define generated artifacts for:

- Module source structure
- Unit and integration test locations
- i18n resource keys
- Event contracts
- Public contracts and exports
- Package or module-level `.gitignore` where required
- Validation commands that must pass before the module is accepted

## Local Developer Doctor Contract

The developer doctor plan MUST define checks for:

- Node.js version
- pnpm availability and version
- Docker availability
- Required environment variables
- PostgreSQL connectivity
- Redis connectivity
- Prisma readiness
- Local Telegram webhook readiness

## Security Baseline Contract

The security baseline MUST define:

- Secret scanning policy
- Dependency review policy
- Blocking audit policy
- Token rotation guidance
- Managed-bot token handling expectations
- CI versus manual enforcement status

## Observability Contract

The observability dashboard plan MUST define dashboard scope for:

- Application logs
- Audit events
- Error tracking
- Queue health
- Session health

## Review-Finding Closure Contract

The remediation plan MUST list each known finding with:

- Finding identifier
- Priority
- Source path
- Current status
- Planned remediation
- Validation command or review action
