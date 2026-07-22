# User Management Module

Profile and administrator user-management workflows for Tempot.

## Purpose

The module provides inline-keyboard-first profile management, administrator user search, and role management. Commands remain available as shortcuts, but the primary UX surface is button-driven navigation.

## Features

- Profile viewing
- Profile editing
- Administrator user management
- Role changes with authorization checks
- Super-admin user blocking with last-active-super-admin protection
- Guest users can submit a new membership request from `/start`
- User search for administrators

## UI/UX

- **Primary**: Inline Keyboards
- **Secondary**: command shortcuts
- **Navigation**: hierarchical menu screens with back actions
- **Start menu**: one action per row with leading icons for narrow Telegram clients

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

## Authorization

`/start` is an explicit bootstrap policy. Known `GUEST` profiles are routed
back to the membership request path instead of receiving an empty protected
menu. Profile reads and edits use separate CASL actions, while user
administration and role or block actions require protected management
authorization. Callback and text-state denials occur before service calls or
pending state mutation.
