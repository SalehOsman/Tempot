# ADR-042: Module-Owned Telegram Navigation

## Status

Accepted

## Context

`user-management` previously rendered the `/start` main menu with hardcoded
callbacks for settings, notifications, messages, statistics, and help. Some of
those callbacks were not owned by any active module, so pressing them reached
the bot-server unhandled callback fallback.

Tempot modules are independently enabled, validated, and loaded. Navigation must
therefore follow the same ownership model as commands and handlers.

## Decision

Modules declare main-menu navigation entries in `module.config.ts` through the
module-registry `navigation.mainMenu` contract. The bot-server builds an active
navigation provider from validated modules and injects it into module setup
dependencies. `user-management` renders `/start` from that provider instead of
hardcoding cross-module buttons.

## Consequences

- A button appears only when its owning module is active and validated.
- Callback ownership is explicit in the module that declares the button.
- Future modules can add or remove menu entries without editing
  `user-management`.
- Role-based menu visibility is handled centrally by the injected navigation
  provider.

## Alternatives Rejected

- Add placeholder callbacks in `user-management`: rejected because it keeps
  ownership in the wrong module and hides missing capabilities.
- Keep a hardcoded menu registry in bot-server: rejected because it requires
  interface-layer edits for every business module.
- Use event discovery for every menu render: rejected for this slice because the
  validated module config already provides a deterministic startup contract.
