# Bot Management Quickstart

**Feature:** 040-bot-management
**Generated:** 2026-05-12

---

## Purpose

This quickstart defines the acceptance path an executor should use after
implementation to prove the feature works. It is not an implementation script.

## Primary Validation Flow

1. Register a managed bot as an administrator.
2. Confirm the bot starts in `DRAFT`.
3. Complete required identity and settings values.
4. Move the bot to `CONFIGURED`.
5. Activate the bot.
6. Pause the bot with a reason.
7. Resume the bot.
8. Place the bot into maintenance with a reason.
9. Return the bot to active.
10. Archive the bot with a reason.

## Package Capability Validation

1. Verify role-based access denies non-admin access.
2. Verify every state-changing action emits an event.
3. Verify every state-changing action records audit data.
4. Verify per-bot settings are persisted and displayed.
5. Verify module enablement supports enabled, disabled, unavailable, and blocked states.
6. Verify a bot can be provisioned from a published template reference.
7. Verify search filters by status, owner, runtime mode, template source, and enabled module.
8. Verify notifications are requested for lifecycle and health events.
9. Verify export redacts secrets.
10. Verify import creates a `DRAFT` profile and reports blocked requirements.

## Required Gates Before Handoff Completion

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm tempot module doctor bot-management
git diff --check
```
