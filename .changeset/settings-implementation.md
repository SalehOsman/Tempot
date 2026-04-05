---
"@tempot/settings": minor
"@tempot/database": patch
"@tempot/event-bus": patch
---

feat(settings): implement hybrid configuration system

New package providing typed access to static and dynamic settings:
- StaticSettingsLoader: zod-validated .env reading at startup
- DynamicSettingsService: type-safe CRUD with 5-min cache TTL
- MaintenanceService: maintenance mode with super admin bypass
- SettingsService: unified facade composing all sub-services
- SettingsRepository: Prisma-based DB abstraction for Setting model
- Event emission for all setting changes via Event Bus
- Graceful degradation: returns defaults when DB unavailable
- Cache failure fallback: falls through to DB (NFR-005)
- 48 unit tests, 5 integration tests with Testcontainers
