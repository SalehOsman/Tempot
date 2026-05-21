# Contract: Navigation Contribution

## Purpose

Defines how modules contribute actions to shared navigation surfaces without direct imports between feature modules.

## Contribution Declaration

Each contribution must provide:

- Stable contribution id.
- Owner module name.
- Navigation surface.
- Localized label key.
- Callback action or namespace.
- Role or permission visibility rules.
- Stable order.
- Availability requirements.

## Callback Ownership Declaration

Each owner must declare:

- Callback action or namespace it handles.
- Whether ownership is exact or namespace-based.
- Localized unavailable-action key for stale callbacks.
- Module that owns the handler.

## Validation Contract

Startup validation must fail or report a blocking error when:

- Two enabled modules claim the same callback action.
- A contribution has no active owner.
- A visible action references missing localization.
- A role-restricted action is visible to an unauthorized user.
- A module declares a contribution but does not register a compatible callback owner.

## Runtime Contract

At runtime:

- Fresh menus show only contributions that passed validation and are available to the user.
- Stale callbacks receive a localized unavailable-action response.
- Module handlers pass through unrelated callbacks.
- The shared fallback handles unowned callback data.

## Follow-up Module Ownership

The following ownership must be implemented in separate specs:

- `settings-management`: settings navigation and settings callbacks.
- `notification-center`: notification views and preference callbacks.
- `content-management`: messages/content navigation and callbacks.
- `audit-viewer`: stats/activity navigation and callbacks.
- `help-center`: capability-aware help navigation and callbacks.
