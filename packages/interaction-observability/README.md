# Interaction Observability

Reusable interaction timeline primitives for Tempot bot handlers and modules.

This package records per-interaction lifecycle events without coupling modules
to the bot server implementation. Runtime applications inject a recorder and
storage sink; modules and UX helpers can record steps through the shared
context helpers.
