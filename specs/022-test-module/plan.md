# Test Module — Implementation Plan

**Feature:** 022-test-module
**Source:** spec.md (Clarified)
**Generated:** 2026-04-26 (retroactive from implemented code)

---

## Technical Approach

This is a **temporary test module** designed to verify the full bot pipeline end-to-end during local development and Docker deployments. It implements minimal business logic and serves as a validation tool for the infrastructure.

### Architecture Impact

- **No architectural changes**
- **No new dependencies** (uses existing infrastructure)
- **No database schema changes**
- **No API changes**

### Tech Stack

- **No new dependencies** - uses existing @tempot/* packages
- **Existing tools**: grammY, Vitest (for verification)

---

## Implementation Strategy

### Phase 1: Module Structure

**Directory**: `apps/bot-server/modules/test-module/`

**Files**:
- `module.config.ts` - Module configuration
- `abilities.ts` - CASL abilities (GUEST only)
- `locales/ar.json` - Arabic translations
- `locales/en.json` - English translations
- `commands/` - Command handlers
  - `start.command.ts` - `/start` command
  - `ping.command.ts` - `/ping` command
  - `whoami.command.ts` - `/whoami` command
  - `dbtest.command.ts` - `/dbtest` command
  - `status.command.ts` - `/status` command

### Phase 2: Command Implementation

**Commands**:

| Command   | Role Required | Description                          | Implementation Notes |
|-----------|--------------|--------------------------------------|----------------------|
| `/start`  | GUEST        | Welcome message + command list       | Use i18n for messages |
| `/ping`   | GUEST        | Round-trip latency measurement       | Measure response time |
| `/whoami` | GUEST        | Display session role, language, status | Read from sessionProvider |
| `/dbtest` | GUEST        | Read `maintenance_mode` from settings | Read from settings service |
| `/status` | GUEST        | Uptime, memory, event bus smoke test | Publish event to eventBus |

### Phase 3: Dependencies Injection

**Dependencies** (injected via deps.factory.ts):
- `deps.sessionProvider` - Session read operations
- `deps.settings` - Dynamic settings read
- `deps.eventBus` - Event publishing
- `deps.logger` - Logging operations

### Phase 4: Testing

**Tests**:
- Unit tests for each command handler
- Integration tests for full pipeline
- Smoke tests for infrastructure validation

---

## Removal Plan

**When to Remove**: When the first real feature module is added

**Files to Delete**:
- `apps/bot-server/modules/test-module/`
- `specs/022-test-module/`

**No Database Changes**: No migrations or schema changes introduced by this module

---

## Success Criteria

1. ✅ All commands work correctly in local development
2. ✅ All commands work correctly in Docker deployment
3. ✅ Module validates full pipeline end-to-end
4. ✅ No database schema changes
5. ✅ No new dependencies added
6. ✅ All tests pass
7. ✅ Module can be removed without side effects

---

## Risk Assessment

### Low Risk 🟢

- **No database changes** - safe to remove
- **No new dependencies** - uses existing infrastructure
- **Minimal code** - easy to understand and maintain
- **Temporary by design** - documented removal plan

### Mitigation Strategies

1. **Documentation**: Clearly document temporary nature in spec.md and ROADMAP.md
2. **Isolation**: Keep module isolated from business logic
3. **Testing**: Comprehensive tests to validate infrastructure
4. **Removal**: Document removal plan in spec.md

---

## Success Metrics

1. ✅ All 5 commands implemented and working
2. ✅ Module validates full pipeline end-to-end
3. ✅ No database schema changes
4. ✅ No new dependencies
5. ✅ All tests pass
6. ✅ Temporary nature documented
7. ✅ Removal plan documented
