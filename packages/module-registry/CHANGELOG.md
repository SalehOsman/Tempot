# @tempot/module-registry

## 0.2.0

### Minor Changes

- 6d42561: feat(module-registry): implement runtime module discovery and validation engine

  New package providing filesystem-based module discovery, validation, and registration:
  - ModuleDiscovery: scans modules directory, loads module.config.ts via DI, validates against zod schema
  - ModuleValidator: structural checks (7 mandatory paths + conditional database files), spec gate enforcement, dependency validation with toggle guard env var checks (DC-3), name uniqueness, error accumulation (DC-5)
  - ModuleRegistry: orchestrates discover-validate-register pipeline, state machine enforcement, core vs optional module failure handling, query interface (getModule, getAllModules, getAllCommands), command registration via bot API
  - 6 lifecycle events registered in event-bus: discovery.completed, module.validated, module.validation_failed, module.skipped, module.registered, module.disabled
  - 98 tests (19 types, 16 schema, 11 discovery, 23 validator, 18 registry, 9 integration, 2 additional)
