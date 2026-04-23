# @tempot/input-engine

## 0.2.0

### Minor Changes

- 45f910e: Add Phase 2 UX & Integration features: optional field skip with auto-skip on max retries, cancel button and /cancel text interception, validation error display with retry context, dynamic progress indicator, bidirectional field iteration with back navigation, confirmation step with edit/cancel flow, storage engine integration for 5 media handlers, and AI extraction full flow with confirmation/fallback. 622 tests (up from 448).

### Patch Changes

- 7a268ff: Add form.resumed lifecycle event, wire partial save into FormRunner, enforce form timeout, implement render layer for 19 custom field handlers, use guardEnabled() wrapper
  - @tempot/session-manager@0.1.2
  - @tempot/ux-helpers@0.1.2
