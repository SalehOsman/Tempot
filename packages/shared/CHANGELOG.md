# @tempot/shared

## 0.1.1

### Patch Changes

- b3bdb83: Add typed publish contracts via TempotEvents conditional generics (ADR-036); add session.redis.degraded and system.alert.critical events to the registry. Type EventBusAdapter in session-manager with method overloads for session-specific events. Change cache EventBus.publish return type from Promise<void> to AsyncResult<void, AppError> and add system.alert.critical typed overload.
- 9f1d63f: Handle publish() Result in cache fallback (Rule X - no silent failures)

  Changed `fallbackToMemory` to inspect the `AsyncResult` returned by
  `eventBus.publish()` and log a warning when it fails, instead of
  silently discarding the Result. Changed visibility from private to
  protected to enable direct unit testing.
