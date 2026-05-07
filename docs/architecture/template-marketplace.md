# Template Marketplace

**Status**: Future architecture planning artifact for spec #026

## Purpose

The template marketplace is a future internal catalog of activatable bot feature templates. It should make Tempot easier to adopt while keeping module boundaries and security rules intact.

## Scope

Marketplace entries may include:

- Module templates.
- Command templates.
- Input form templates.
- AI assistant templates.
- Notification templates.
- Managed bot starter templates.

## Entry Metadata

Each entry should define:

- Name.
- Description.
- Version.
- Required packages.
- Required permissions.
- Locale keys.
- Events published.
- Settings required.
- Security notes.
- Tests generated.

## Activation Rules

- Activation must go through module-registry.
- Generated code must follow the new module checklist.
- No template may write secrets.
- No template may bypass SpecKit for production use.
- Managed bot templates require the managed-bot security baseline.

## Non-Goals

- No public marketplace implementation now.
- No package registry publishing now.
- No one-click production deployment until security and doctor checks exist.
