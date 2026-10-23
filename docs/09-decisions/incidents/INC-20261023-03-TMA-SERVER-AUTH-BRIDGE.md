# 🚨 Incident Record: INC-20261023-03-TMA-SERVER-AUTH-BRIDGE

* **Incident ID:** INC-20261023-03
* **Date:** 2026-10-23
* **Severity:** MEDIUM
* **Status:** RESOLVING
* **Impacted Components:** `apps/tma`, `apps/server`, `modules/kernel/access-control`

---

## 1. Executive Summary

`apps/server` has an endpoint `POST /api/v1/auth/telegram` that cryptographically validates Telegram's HMAC-SHA256 `initData` signature via `@tembot/module-access-control`. However, the React frontend in `apps/tma` was operating as a standalone client without calling this endpoint upon initialization, meaning user identity was not authenticated on the backend.

---

## 2. Root Cause Analysis

The initial implementation prioritized rendering and mobile styling over the backend authentication handshake. The Telegram WebApp SDK was present, but no React hook existed to transmit `window.Telegram.WebApp.initData` to the server API and retrieve an authenticated session token.

---

## 3. Remediation & Sentinel Gate

1. Build `useTelegramAuth` hook in `apps/tma/src/hooks/useTelegramAuth.ts`.
2. Hook automatically captures `initData`, calls `POST /api/v1/auth/telegram`, and stores the resulting actor session in state.
3. Add end-to-end unit test in `apps/server/test/server.test.ts` verifying the full handshake.
