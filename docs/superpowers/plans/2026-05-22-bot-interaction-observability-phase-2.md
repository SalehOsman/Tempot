# Bot Interaction Observability Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bot interaction failures inspectable from the admin stats surface, not only from Docker logs.

**Architecture:** Keep trace capture in `bot-server`, persist outcome metadata in the existing `AuditLog`, and extend `audit-viewer` to query and render recent bot interaction failures. No new package or database table is introduced in this phase.

**Tech Stack:** TypeScript 5.9 strict mode, grammY, Prisma AuditLog via `@tempot/database`, Vitest, i18n JSON locales.

---

### Task 1: Audit Viewer Failure Repository

**Files:**
- Create: `modules/audit-viewer/repositories/interaction-audit.repository.ts`
- Test: `modules/audit-viewer/tests/interaction-audit.repository.test.ts`

- [ ] Write a failing unit test that verifies recent failed bot interactions are requested from `auditLog.findMany` with `status: 'FAILURE'` and bot modules.
- [ ] Implement `InteractionAuditRepository` with a small Prisma-compatible dependency interface.
- [ ] Return sanitized records containing action, module, target trace ID, status, timestamp, callback data, reference code, and error code when present.
- [ ] Run `pnpm --filter @tempot/audit-viewer test`.

### Task 2: Admin Recent Problems View

**Files:**
- Create: `modules/audit-viewer/services/interaction-problem.service.ts`
- Modify: `modules/audit-viewer/index.ts`
- Modify: `modules/audit-viewer/deps.context.ts`
- Modify: `modules/audit-viewer/handlers/callback.handler.ts`
- Modify: `modules/audit-viewer/commands/stats.command.ts`
- Modify: `modules/audit-viewer/menus/stats-menu.factory.ts`
- Modify: `modules/audit-viewer/locales/en.json`
- Modify: `modules/audit-viewer/locales/ar.json`
- Test: `modules/audit-viewer/tests/runtime.test.ts`

- [ ] Write failing runtime tests for `stats:problems` rendering recent failures.
- [ ] Add service formatting that uses i18n keys and dynamic values.
- [ ] Add a Problems button to the stats menu.
- [ ] Wire the repository through module dependencies.
- [ ] Run `pnpm --filter @tempot/audit-viewer test`.

### Task 3: Runtime Wiring And Verification

**Files:**
- Modify: `apps/bot-server/src/startup/module-loader.ts`
- Modify: `apps/bot-server/src/bot-server.types.ts`
- Test: `apps/bot-server/tests/unit/module-loader.test.ts`

- [ ] Add the audit repository dependency to module setup only through the bot-server dependency container.
- [ ] Verify audit-viewer receives the repository without direct cross-module imports.
- [ ] Run bot-server tests, runtime build, lint, and SpecKit validation.
