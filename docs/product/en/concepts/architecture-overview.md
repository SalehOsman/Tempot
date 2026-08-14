---
title: Architecture Overview
description: Understanding the Tempot architecture, its three layers, and core design principles
tags:
  - concepts
  - architecture
  - design
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## What is Tempot?

Tempot (Template + Bot) is a comprehensive enterprise framework for building professional Telegram bots. It provides all infrastructure out of the box so the developer focuses exclusively on business logic.

## The Three Layers

Tempot follows Clean Architecture principles with three distinct layers:

### Core Layer

Contains business logic, modules, and services. This layer is completely independent of external technologies.

### Services Layer

Handles external resources: database, storage, AI. Every external service is wrapped in a swappable abstraction layer.

### Interface Layer

The end-user interaction point: Telegram, web, and dashboard interfaces.

## Five Architectural Principles

These rules are non-negotiable and enforced in every code review:

### 1. Abstraction Layer for Every External Resource

Every external service (AI, storage, payment) is wrapped in a swappable interface. This allows changing providers without modifying business logic.

### 2. Unified Cache Layer

Uses `cache-manager` with Keyv adapters in a tiered system: memory, then Redis, then database.

### 3. Central Queue Factory

All queues are managed through BullMQ via a central factory in the shared package.

### 4. Event-Driven Communication

Modules never communicate directly. All inter-module communication flows exclusively through the Event Bus.

### 5. Graceful Degradation

Every external service has a documented fallback scenario. If an AI provider goes down, the system continues operating without it.

## Monorepo Structure

The project uses pnpm workspaces with a clear separation:

| Directory   | Purpose                         |
| ----------- | ------------------------------- |
| `apps/`     | Applications (bot-server, docs) |
| `packages/` | Shared packages (20 packages)   |
| `modules/`  | Business modules                |
| `specs/`    | SpecKit specifications          |
| `docs/`     | Documentation                   |

## Core Packages

| Package           | Role                                                           |
| ----------------- | -------------------------------------------------------------- |
| `shared`          | Common utilities, types, `AppError`, cache and queue factories |
| `logger`          | Structured logging via Pino                                    |
| `event-bus`       | Event bus (local, internal, external via Redis Pub/Sub)        |
| `auth-core`       | CASL-based RBAC authorization                                  |
| `database`        | PostgreSQL with Prisma ORM                                     |
| `session-manager` | Redis-backed session management                                |
| `i18n-core`       | Internationalization via i18next (Arabic primary + English)    |
| `module-registry` | Module discovery, validation, and registration                 |
| `ai-core`         | AI provider abstraction via Vercel AI SDK                      |

## Result Pattern

Tempot uses the `neverthrow` library instead of throwing exceptions. All public functions return `Result<T, AppError>`:

```typescript
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

function divide(a: number, b: number): Result<number, AppError> {
  if (b === 0) {
    return err(AppError.validation('Cannot divide by zero'));
  }
  return ok(a / b);
}
```

## Pluggable Architecture

Every package and feature can be independently enabled or disabled via environment variables (Toggle Guards). This allows lightweight deployments that include only the required features.
