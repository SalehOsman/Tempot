# Test Module — Data Model

**Feature:** 022-test-module
**Source:** spec.md + plan.md
**Generated:** 2026-04-26 (retroactive from implemented code)

---

## Overview

This is a **temporary test module** with **minimal data model changes**. No database schemas, no new API contracts, no complex data structures.

---

## No Database Changes

**Reason**: This module is temporary and designed to validate infrastructure without introducing persistent data.

**Verification**:
- No Prisma schema changes
- No Drizzle schema changes
- No migration files
- No database queries (read-only operations only)

---

## No New API Contracts

**Reason**: This module uses existing infrastructure APIs provided by @tempot/* packages.

**Verification**:
- No new interfaces
- No new types
- No new functions
- No function signature changes

---

## No New Data Structures

**Reason**: This module uses existing data structures provided by @tempot/* packages.

**Verification**:
- No new classes
- No new enums
- No new constants
- No data transformations

---

## Used Data Structures (Existing)

### Session Data

**Source**: `@tempot/session-manager`

**Structure**:
```typescript
interface Session {
  id: string;
  userId?: string;
  userRole?: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  language?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
```

**Usage**: Read from `deps.sessionProvider` in `/whoami` command

---

### Settings Data

**Source**: `@tempot/settings`

**Structure**:
```typescript
interface DynamicSetting {
  key: string;
  value: string;
  updatedAt: Date;
}
```

**Usage**: Read `maintenance_mode` from `deps.settings` in `/dbtest` command

---

### Event Data

**Source**: `@tempot/event-bus`

**Structure**:
```typescript
interface EventEnvelope<T = unknown> {
  eventId: string;
  eventName: string;
  module: string;
  userId?: string;
  payload: T;
  timestamp: Date;
  level: 'LOCAL' | 'INTERNAL' | 'EXTERNAL';
}
```

**Usage**: Publish test event to `deps.eventBus` in `/status` command

---

## Command Data Models

### `/start` Command

**Input**: None (triggered by `/start` command)

**Output**: Welcome message + command list

**Data Flow**:
```
User sends /start
  ↓
Command handler reads i18n translations
  ↓
Returns welcome message + command list
```

---

### `/ping` Command

**Input**: None (triggered by `/ping` command)

**Output**: Latency in milliseconds

**Data Flow**:
```
User sends /ping
  ↓
Command handler measures start time
  ↓
Command handler processes request
  ↓
Command handler measures end time
  ↓
Calculates latency = end - start
  ↓
Returns latency in ms
```

---

### `/whoami` Command

**Input**: None (triggered by `/whoami` command)

**Output**: Session role, language, status

**Data Flow**:
```
User sends /whoami
  ↓
Command handler reads session from deps.sessionProvider
  ↓
Extracts role, language, status
  ↓
Returns session information
```

---

### `/dbtest` Command

**Input**: None (triggered by `/dbtest` command)

**Output**: Current maintenance mode

**Data Flow**:
```
User sends /dbtest
  ↓
Command handler reads maintenance_mode from deps.settings
  ↓
Returns maintenance mode value
```

---

### `/status` Command

**Input**: None (triggered by `/status` command)

**Output**: Uptime, memory usage, event bus status

**Data Flow**:
```
User sends /status
  ↓
Command handler calculates uptime
  ↓
Command handler gets memory usage
  ↓
Command handler publishes test event to deps.eventBus
  ↓
Returns uptime, memory, event bus status
```

---

## Translation Data Models

### Arabic Translations (`locales/ar.json`)

```json
{
  "commands": {
    "start": {
      "welcome": "مرحباً بك في Tempot!",
      "description": "هذا وحدة اختبار مؤقتة للتحقق من البنية التحتية.",
      "available_commands": "الأوامر المتاحة:"
    },
    "ping": {
      "latency": "زمن الاستجابة: {{latency}}ms"
    },
    "whoami": {
      "role": "الدور: {{role}}",
      "language": "اللغة: {{language}}",
      "status": "الحالة: {{status}}"
    },
    "dbtest": {
      "maintenance_mode": "وضع الصيانة: {{mode}}"
    },
    "status": {
      "uptime": "مدة التشغيل: {{uptime}}",
      "memory": "استخدام الذاكرة: {{memory}}",
      "event_bus": "نظام الأحداث: {{status}}"
    }
  }
}
```

---

### English Translations (`locales/en.json`)

```json
{
  "commands": {
    "start": {
      "welcome": "Welcome to Tempot!",
      "description": "This is a temporary test module to verify infrastructure.",
      "available_commands": "Available commands:"
    },
    "ping": {
      "latency": "Latency: {{latency}}ms"
    },
    "whoami": {
      "role": "Role: {{role}}",
      "language": "Language: {{language}}",
      "status": "Status: {{status}}"
    },
    "dbtest": {
      "maintenance_mode": "Maintenance mode: {{mode}}"
    },
    "status": {
      "uptime": "Uptime: {{uptime}}",
      "memory": "Memory usage: {{memory}}",
      "event_bus": "Event bus: {{status}}"
    }
  }
}
```

---

## Summary

This feature involves **minimal data model changes**:

1. **No database schemas** - read-only operations only
2. **No new API contracts** - uses existing infrastructure
3. **No new data structures** - uses existing types
4. **Translation files** - ar.json and en.json for i18n
5. **Command data models** - simple input/output flows

All data structures are **read-only** and **temporary** by design. No persistent data is introduced by this module.
