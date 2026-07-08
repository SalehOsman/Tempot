---
"@tempot/user-management": patch
---

Fix Telegram user lookup against the BigInt Prisma field so existing super admin
profiles are found correctly by `/start`.
