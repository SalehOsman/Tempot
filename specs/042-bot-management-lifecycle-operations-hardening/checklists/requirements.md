# Requirements Checklist: Bot Management Lifecycle Operations Hardening

- [x] Scope is limited to lifecycle operations and excludes unrelated module slices.
- [x] Existing `LifecycleService` remains the source of truth for transition rules.
- [x] Reason-required transitions use `@tempot/input-engine`.
- [x] Archive requires explicit confirmation.
- [x] Menus are inline-first and state-derived.
- [x] Documentation and SpecKit reconciliation are mandatory before merge.
