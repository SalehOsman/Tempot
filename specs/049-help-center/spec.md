# Feature Specification: help-center

## User Stories

### Story 1 - Open Help

Users can open contextual help from the main menu or `/help`.

## Functional Requirements

- FR-001: The module MUST expose a `/help` command.
- FR-002: The module MUST own the `help:*` callback namespace.
- FR-003: The module MUST declare its help navigation contribution in module configuration.

## Acceptance Criteria

- SC-001: Pressing the Help button opens a help page instead of the unhandled callback fallback.

## Non-Functional Requirements

- The help page MUST render from i18n keys only.
