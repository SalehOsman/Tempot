# Feature Specification: notification-center

## User Stories

### Story 1 - Open Notifications

Users can open a notification center from the main menu or `/notifications`.

## Functional Requirements

- FR-001: The module MUST expose a `/notifications` command.
- FR-002: The module MUST own the `notifications:*` callback namespace.
- FR-003: The module MUST publish a test notification request event.

## Acceptance Criteria

- SC-001: Pressing the Notifications button opens a notification page instead of the unhandled callback fallback.

## Non-Functional Requirements

- The notification page MUST render from i18n keys only.
