# Bot Management

`bot-management` is the operational Tempot module for managed Telegram bot
profiles. It owns the registry, lifecycle contracts, settings profiles, module
enablement state, template source attribution, and import/export profile
contracts.

This module does not start, stop, or reconfigure running bot processes. Runtime
consumers must use approved events and package contracts.

## Current Implementation

Production completion is in progress under Spec #040. The current implementation
includes the module shell, contracts, locale keys, Prisma schema references,
managed bot repository, registration service, Telegram list/detail menus,
`/bots`, `/new_bot`, callback handlers, text registration flow, and targeted
unit tests for the registry slice.

The module is not yet production complete. Remaining work is tracked in
`specs/040-bot-management/tasks.md` and the production completion plan under
`docs/superpowers/plans/2026-05-12-bot-management-production-completion.md`.
