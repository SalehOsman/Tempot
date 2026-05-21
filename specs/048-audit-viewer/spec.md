# Feature Specification: audit-viewer

## User Stories

### Story 1 - Open Stats

Administrators can open operational statistics from the main menu or `/stats`.

## Functional Requirements

- FR-001: The module MUST expose a `/stats` command.
- FR-002: The module MUST own the `stats:*` callback namespace.
- FR-003: The module navigation contribution MUST require `ADMIN`.

## Acceptance Criteria

- SC-001: Pressing the Stats button opens an operational statistics page instead of the unhandled callback fallback.

## Non-Functional Requirements

- The statistics page MUST render from i18n keys only.
