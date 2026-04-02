# @tempot/event-bus

## 0.2.0

### Minor Changes

- b3bdb83: Add typed publish contracts via TempotEvents conditional generics (ADR-036); add session.redis.degraded and system.alert.critical events to the registry. Type EventBusAdapter in session-manager with method overloads for session-specific events. Change cache EventBus.publish return type from Promise<void> to AsyncResult<void, AppError> and add system.alert.critical typed overload.

### Patch Changes

- Updated dependencies [b3bdb83]
- Updated dependencies [9f1d63f]
  - @tempot/shared@0.1.1
