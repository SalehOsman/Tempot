---
'@tempot/database': patch
'@tempot/event-bus': patch
'@tempot/sentry': patch
'@tempot/session-manager': patch
'@tempot/storage-engine': patch
---

Remediate production delivery dependency advisories by upgrading Sentry,
Google Drive, Testcontainers, and pinned transitive security overrides used by
the release toolchain.
