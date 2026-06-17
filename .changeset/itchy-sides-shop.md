---
"@tempot/database": patch
"@tempot/i18n-core": patch
"@tempot/settings": patch
"bot-server": patch
"docs": patch
---

Harden CI and Docker build execution by using the pinned pnpm toolchain directly,
making docs content-link setup Docker-context aware, and isolating sensitive data
integration fixtures on shared CI databases.
