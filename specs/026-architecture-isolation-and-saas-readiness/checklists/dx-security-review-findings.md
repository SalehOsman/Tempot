# Checklist: DX, Security, and Review Findings Coverage

**Purpose**: Confirm approved quality proposals and known review findings are explicit in spec #026 before implementation.
**Created**: 2026-04-28
**Feature**: Architecture Isolation and SaaS Readiness

## DX Proposals

- [ ] Official CLI path is documented: `create-tempot-bot` or `pnpm tempot init`.
- [ ] Module generator output is documented: source, tests, i18n, events, contracts, and exports.
- [ ] Local developer doctor checks are documented: Node.js, pnpm, Docker, environment variables, PostgreSQL, Redis, Prisma, and webhook readiness.
- [ ] Quick path documentation target is documented for building the first real module in about 15 minutes.
- [ ] Internal template marketplace is documented as a future activatable bot-feature catalog.

## Product and Operations Proposals

- [ ] Future admin dashboard scope is documented for modules, settings, users, bots, and tenant administration.
- [ ] Observability dashboard scope is documented for logs, audit events, errors, queues, and sessions.
- [ ] Security baseline is documented for secret scanning, dependency review, and token rotation guidance.

## Review Findings

- [ ] Spec validation drift is represented as resolved or planned with a validation command.
- [ ] Roadmap drift is represented as resolved or planned with a roadmap update path.
- [ ] Non-blocking security audit is represented with a blocking-audit policy decision.
- [ ] Hardcoded user-facing text is represented with an i18n remediation path.
- [ ] User-management package checklist gaps are represented with package-level remediation tasks.
