# Bot Management Lifecycle Operations Hardening Design

**Date:** 2026-05-13  
**Feature:** Spec #042  
**Decision:** Build the next `bot-management` production slice around complete
Telegram lifecycle operations, not provisioning or notifications.

## Design Summary

`bot-management` already has lifecycle transition policy, service logic,
repositories, and events. The missing production layer is the Telegram-facing
surface that exposes those rules safely.

The approved design is:

1. Add a lifecycle inline menu reachable from bot details.
2. Derive visible actions from current lifecycle state.
3. Execute simple allowed transitions directly through `LifecycleService`.
4. Use `@tempot/input-engine` to collect reasons for pause, maintenance, and
   archive.
5. Require archive confirmation before its reason flow starts.
6. Return success and failure outcomes to localized Telegram surfaces without
   duplicating domain logic.

## Why This Scope

This is the highest-value next slice after Spec #041 because registration is now
production-aligned, and the next operational step is governing the bot after it
exists. Settings, provisioning, search, notifications, and import/export stay
separate so each can receive dedicated acceptance criteria and validation.

## Architecture Shape

- `LifecycleService` remains authoritative.
- Callback handling extends the existing module router.
- A new lifecycle menu factory projects valid actions.
- A new lifecycle reason conversation captures governed free-text reasons.
- Archive adds a confirm/cancel step before reason capture.
- No new persistence models or cross-module imports are introduced.

## Testing Strategy

Tests must cover:

- menu action visibility by state
- opening lifecycle surface from detail view
- direct valid transition execution
- stale/invalid/missing-bot handling
- reason-required flow entry
- cancellation without mutation
- archive confirmation behavior
- registration of the additional conversation runtime path

## Reuse Discipline

- `@tempot/input-engine`: structured reason collection
- existing lifecycle domain service: transition validation and persistence
- current inline-first callback/menu pattern: Telegram navigation
- existing i18n keys plus minimal new localized copy where required

No local map-backed pending lifecycle state is approved.
