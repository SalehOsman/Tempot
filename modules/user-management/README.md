# User Management Module

Profile and administrator user-management workflows for Tempot.

## Purpose

The module provides inline-keyboard-first profile management, administrator user search, and role management. Commands remain available as shortcuts, but the primary UX surface is button-driven navigation.

## Features

- Profile viewing
- Profile editing
- Administrator user management
- Role changes with authorization checks
- User search for administrators

## UI/UX

- **Primary**: Inline Keyboards
- **Secondary**: command shortcuts
- **Navigation**: hierarchical menu screens with back actions

## Commands

| Command | Description | Access |
| ------- | ----------- | ------ |
| `/start` | Show the main menu | All users |
| `/profile` | Open the profile shortcut | All users |
| `/users` | Open user management | Admin and above |

## Dependencies

| Package | Purpose |
| ------- | ------- |
| `@tempot/session-manager` | Session management |
| `@tempot/database` | User repositories |
| `@tempot/event-bus` | Event publishing |
| `@tempot/i18n-core` | Translations |
| `@tempot/shared` | Result pattern and application errors |
| `@tempot/ux-helpers` | Inline keyboards and status messages |
| `@tempot/regional-engine` | Regional formatting |
| `@tempot/input-engine` | Dynamic forms |
| `@tempot/auth-core` | Authorization |

## Status

Implemented. Current hardening focus: package checklist compliance, documentation parity, and benchmark coverage.
