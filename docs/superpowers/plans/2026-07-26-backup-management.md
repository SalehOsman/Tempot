# Backup Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Tempot backup capability as a reusable `@tempot/backup-engine` package plus a `backup-management` operator module.

**Architecture:** Backup execution, restore rehearsal, manifest generation, integrity verification, retention, and failure classification live in `@tempot/backup-engine`. Telegram/admin UX lives in `modules/backup-management` and composes the package through injected ports, events, notifier, settings, storage-engine, database repositories, and UX helpers.

**Tech Stack:** TypeScript 5.9.3 strict mode, Vitest 4.1.0, neverthrow 8.2.0, PostgreSQL metadata through repository boundaries, storage-engine artifact ports, event-bus lifecycle events, notifier operator alerts, shared queue factory.

---

## Phase 1: Backup Engine Foundation

- [x] Create package scaffold for `packages/backup-engine` with checklist-compliant package metadata.
- [x] Write failing unit tests for backup request validation, job creation, and concurrency blocking.
- [x] Implement `BackupEngineService` with `Result<T, AppError>` outcomes.
- [x] Write failing unit tests for manifest generation and unsafe metadata rejection.
- [x] Implement manifest generation with safe metadata only.
- [x] Write failing unit tests for retention preview and latest usable complete backup protection.
- [x] Implement retention preview.
- [x] Implement backup job, artifact, and restore rehearsal metadata repositories.

## Phase 2: Restore Rehearsal Foundation

- [x] Write failing tests that block live restore targets.
- [x] Implement isolated restore target validation.
- [x] Write tests for restore rehearsal result classification.
- [x] Implement restore rehearsal service contracts.

## Phase 3: Package Composition

- [x] Add storage artifact ports.
- [x] Add notifier ports.
- [x] Add event publisher ports.
- [x] Add settings port for `backup_schedule`.
- [x] Add queue orchestration port for asynchronous backup jobs.

## Phase 4: Backup Management Module

- [x] Create `modules/backup-management` scaffold.
- [x] Add localized menu, empty-state, detail, confirmation, and permission tests.
- [x] Implement super-admin-only operator surfaces.
- [x] Wire package contracts through dependency context.
- [x] Add governed `module.flow.json`.

## Phase 5: Verification And Evidence

- [x] Run package and module unit tests.
- [x] Run build and methodology gates.
- [x] Run docs/spec validation.
- [ ] Update roadmap and operational evidence template.
