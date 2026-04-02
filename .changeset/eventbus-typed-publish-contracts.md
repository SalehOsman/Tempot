---
'@tempot/event-bus': minor
'@tempot/session-manager': patch
'@tempot/shared': patch
---

Add typed publish contracts via TempotEvents conditional generics (ADR-036); add session.redis.degraded and system.alert.critical events to the registry. Type EventBusAdapter in session-manager with method overloads for session-specific events. Change cache EventBus.publish return type from Promise<void> to AsyncResult<void, AppError> and add system.alert.critical typed overload.
