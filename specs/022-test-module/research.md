# Test Module — Technical Research

**Feature:** 022-test-module
**Source:** spec.md + plan.md
**Generated:** 2026-04-26 (retroactive from implemented code)

---

## Overview

This is a **temporary test module** with minimal technical research required. No new technologies, no architectural decisions, no complex implementations.

---

## Research Topic 1: Module Discovery & Validation

### Question

How does module-registry discover and validate test-module?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/module-registry/` - Module discovery logic
2. `f:\Tempot\apps/bot-server/modules/test-module/module.config.ts` - Module configuration
3. Constitution Rule XLVI: Module Creation Gate

### Findings

**Module Discovery Process**:
1. module-registry scans `apps/bot-server/modules/*/`
2. Reads `module.config.ts` from each module directory
3. Validates required files: `module.config.ts`, `abilities.ts`, `locales/ar.json`, `locales/en.json`
4. Registers commands with grammY router
5. Enforces spec gate - refuses to load modules without approved `spec.md`

**Module Configuration Structure**:
```typescript
export const moduleConfig = {
  name: 'test-module',
  version: '0.1.0',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'start', description: 'Welcome message' },
    { command: 'ping', description: 'Latency test' },
    { command: 'whoami', description: 'Session info' },
    { command: 'dbtest', description: 'Database test' },
    { command: 'status', description: 'System status' }
  ],
  features: {
    hasDatabase: false,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false
  }
};
```

### Decision

Follow module-registry validation rules. Ensure all required files exist and are properly structured.

### References

- Constitution Rule XLVI: Module Creation Gate
- module-registry README.md: Module validation rules

---

## Research Topic 2: Session Provider Integration

### Question

How to read session data from deps.sessionProvider?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/session-manager/` - Session provider implementation
2. `f:\Tempot\apps/bot-server/deps.factory.ts` - Dependency injection
3. Constitution Rule XXVII: Soft Delete

### Findings

**Session Provider API**:
```typescript
interface ISessionProvider {
  getSession(userId: string): AsyncResult<Session | null, AppError>;
  createSession(userId: string, data: Partial<Session>): AsyncResult<Session, AppError>;
  updateSession(userId: string, data: Partial<Session>): AsyncResult<Session, AppError>;
  deleteSession(userId: string): AsyncResult<void, AppError>;
}
```

**Dependency Injection**:
```typescript
// In deps.factory.ts
export const deps = {
  sessionProvider: sessionProvider,
  settings: settingsService,
  eventBus: eventBusOrchestrator,
  logger: logger
};
```

**Usage in Command Handler**:
```typescript
export async function whoamiCommand(ctx: Context): AsyncResult<void, AppError> {
  const userId = ctx.from?.id?.toString();
  if (!userId) {
    return err(new AppError('test-module.user_id_missing'));
  }

  const sessionResult = await deps.sessionProvider.getSession(userId);
  if (sessionResult.isErr()) {
    return sessionResult;
  }

  const session = sessionResult.value;
  // Display session information
}
```

### Decision

Use `deps.sessionProvider.getSession()` to read session data. Handle errors via Result pattern.

### References

- session-manager README.md: Session provider API
- Constitution Rule XXI: Result Pattern

---

## Research Topic 3: Settings Service Integration

### Question

How to read maintenance_mode from deps.settings?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/settings/` - Settings service implementation
2. `f:\Tempot\apps/bot-server/deps.factory.ts` - Dependency injection

### Findings

**Settings Service API**:
```typescript
interface SettingsService {
  getStatic(): Result<StaticSettings, AppError>;
  getDynamic(key: string): AsyncResult<DynamicSetting | null, AppError>;
  setDynamic(key: string, value: string): AsyncResult<DynamicSetting, AppError>;
}
```

**Maintenance Mode Setting**:
```typescript
const maintenanceModeResult = await deps.settings.getDynamic('maintenance_mode');
if (maintenanceModeResult.isErr()) {
  return maintenanceModeResult;
}

const maintenanceMode = maintenanceModeResult.value?.value ?? 'false';
```

### Decision

Use `deps.settings.getDynamic('maintenance_mode')` to read maintenance mode. Handle errors via Result pattern.

### References

- settings README.md: Settings service API
- Constitution Rule XXI: Result Pattern

---

## Research Topic 4: Event Bus Integration

### Question

How to publish test event to deps.eventBus?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/event-bus/` - Event bus implementation
2. `f:\Tempot\apps/bot-server/deps.factory.ts` - Dependency injection
3. Constitution Rule XV: Event-Driven Communication

### Findings

**Event Bus API**:
```typescript
interface EventBusOrchestrator {
  publish<T>(eventName: string, payload: T): AsyncResult<void, AppError>;
  subscribe<T>(eventName: string, handler: (event: EventEnvelope<T>) => void): void;
}
```

**Event Naming Convention**:
- Format: `{module}.{entity}.{action}`
- Example: `test-module.status.checked`

**Publishing Test Event**:
```typescript
const eventPayload = {
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date()
};

const publishResult = await deps.eventBus.publish(
  'test-module.status.checked',
  eventPayload
);

if (publishResult.isErr()) {
  return publishResult;
}
```

### Decision

Use `deps.eventBus.publish()` with proper event naming convention. Handle errors via Result pattern.

### References

- event-bus README.md: Event bus API
- Constitution Rule XV: Event-Driven Communication

---

## Research Topic 5: i18n Integration

### Question

How to use i18n for command messages?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/i18n-core/` - i18n implementation
2. Constitution Rule XXXIX: i18n-Only Rule

### Findings

**i18n API**:
```typescript
import { t } from '@tempot/i18n-core';

const message = t('commands.start.welcome');
const interpolated = t('commands.ping.latency', { latency: 123 });
```

**Translation Files**:
- `locales/ar.json` - Arabic translations
- `locales/en.json` - English translations

**Rule Compliance**:
- Zero hardcoded user-facing text in `.ts` files (Rule XXXIX)
- All user-visible strings via i18n keys
- Arabic primary + English fallback

### Decision

Use `t()` function for all user-facing messages. No hardcoded strings.

### References

- i18n-core README.md: i18n API
- Constitution Rule XXXIX: i18n-Only Rule

---

## Research Topic 6: Testing Strategy

### Question

How to test test-module commands?

### Investigation

**Sources Checked**:
1. `f:\Tempot\packages/ux-helpers/tests/` - Test examples
2. Constitution Rule XXXIV: TDD Mandatory

### Findings

**Test Structure**:
```
apps/bot-server/modules/test-module/
  tests/
    unit/
      start.command.test.ts
      ping.command.test.ts
      whoami.command.test.ts
      dbtest.command.test.ts
      status.command.test.ts
    integration/
      full-pipeline.test.ts
```

**Test Naming Convention**:
```typescript
describe('start.command', () => {
  it('should send welcome message when /start is triggered', async () => {
    // Test implementation
  });
});
```

**Mocking Dependencies**:
```typescript
vi.mock('@tempot/session-manager', () => ({
  sessionProvider: {
    getSession: vi.fn()
  }
}));
```

### Decision

Follow TDD methodology (RED → GREEN → REFACTOR). Use Vitest for testing. Mock dependencies.

### References

- Constitution Rule XXXIV: TDD Mandatory
- Constitution Rule XXXVII: Test Naming Convention

---

## Research Topic 7: Removal Strategy

### Question

How to safely remove test-module when no longer needed?

### Investigation

**Sources Checked**:
1. `f:\Tempot\docs/archive/ROADMAP.md` - Removal plan
2. spec.md - Temporary nature documentation

### Findings

**Files to Delete**:
- `apps/bot-server/modules/test-module/` - Module implementation
- `specs/022-test-module/` - Spec artifacts

**No Database Changes**:
- No migrations to rollback
- No schema changes to revert
- No data to migrate

**Safe Removal Process**:
1. Verify no other modules depend on test-module
2. Delete module directory
3. Delete spec artifacts
4. Update ROADMAP.md
5. Update CHANGELOG.md

### Decision

Document removal plan in spec.md and ROADMAP.md. Ensure no dependencies exist before removal.

### References

- spec.md: Removal section
- Constitution Rule VIII: No Zombie Code

---

## Research Summary

### Key Findings

1. **Module Discovery**: module-registry validates required files and registers commands
2. **Session Provider**: Use `deps.sessionProvider.getSession()` via Result pattern
3. **Settings Service**: Use `deps.settings.getDynamic()` via Result pattern
4. **Event Bus**: Use `deps.eventBus.publish()` with proper naming convention
5. **i18n Integration**: Use `t()` function for all user-facing messages
6. **Testing Strategy**: Follow TDD methodology with Vitest
7. **Removal Strategy**: Delete module and spec artifacts, no database changes

### Decisions Made

1. Follow module-registry validation rules
2. Use Result pattern for all dependency calls
3. Follow event naming convention
4. Use i18n for all user-facing messages
5. Follow TDD methodology
6. Document removal plan clearly

### No Further Research Required

All research topics resolved. No new technologies, no architectural decisions, no complex implementations. This is a straightforward temporary test module.
