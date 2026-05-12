# Bot Management

`bot-management` is the operational Tempot module for managed Telegram bot
profiles. It owns the registry, lifecycle contracts, settings profiles, module
enablement state, template source attribution, and import/export profile
contracts.

This module does not start, stop, or reconfigure running bot processes. Runtime
consumers must use approved events and package contracts.
