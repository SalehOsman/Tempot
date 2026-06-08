---
"bot-server": patch
"@tempot/auth-core": patch
"@tempot/user-management": patch
"@tempot/template-management": patch
"@tempot/bot-management": patch
"@tempot/settings-management": patch
"@tempot/notification-center": patch
"@tempot/content-management": patch
"@tempot/audit-viewer": patch
"@tempot/help-center": patch
---

Correct Telegram authorization context construction and enforce explicit CASL
action/subject policies across active commands, callbacks, text states, and
deferred conversation mutations.
