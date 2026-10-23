# Domain Model & Ubiquitous Language

## 1. Purpose
This document establishes the canonical domain vocabulary across the Tembot-v2 Platform. All code types, database schemas, and API contracts must align with the terms defined herein.

---

## 2. Ubiquitous Language Glossary

| Term | Domain Definition | Code Entity / Contract |
| :--- | :--- | :--- |
| **Actor** | An authenticated entity (end-user, operator, or background worker) performing actions. | `ActorIdentity` |
| **Arbitrary-Precision Math** | Exact arithmetic calculation of monetary amounts using `decimal.js` (no floating-point numbers). | `Decimal` |
| **Audit Record** | An append-only historical snapshot of a state transition with actor attribution. | `AuditTrailRecord` |
| **Bounded Context** | An explicit boundary within which a specific domain model and business rules apply. | `Module` / `BoundedContext` |
| **Callback Data Budget** | Telegram limitation where inline button callback payloads must not exceed 36 bytes. | `CallbackPayload` |
| **Capability** | An atomic, fine-grained permission string (e.g. `settings:write`, `orders:create`). | `Capability` (`ctx.can`) |
| **Double-Entry Bookkeeping** | Financial invariant where $\sum \text{Debits} \equiv \sum \text{Credits}$ across all financial movements. | `LedgerTransaction` |
| **Functional Core, Imperative Shell (FCIS)** | Pure domain business logic with zero side effects, isolated from I/O and persistence. | `DomainModel` / `Ports` |
| **Hono RPC** | End-to-end typed client-server communication mechanism via `hono/client`. | `AppType` / `hc` |
| **Idempotency Key** | A unique cryptographic nonce or reference string preventing duplicate executions. | `IdempotencyKey` |
| **InitData Verification** | Cryptographic validation of Telegram Web App query parameters via HMAC-SHA256. | `validateInitData` |
| **Neverthrow Result** | Functional error handling modeling errors as explicit return values: `Result<T, E>`. | `Result` / `ok` / `err` |
| **Pinned Base Time** | A deterministic clock anchor ensuring reproducible temporal testing. | `PINNED_BASE_TIME` |
| **Rich Message** | A structured Telegram message template (Blocks, Markdown, Buttons, Tables) adhering to layout budgets. | `InputRichMessage` |
| **Soft Delete** | Retaining records upon deletion by populating `deleted_at` rather than physical SQL deletion. | `deleted_at` column |
| **Tenant ID** | An optional identifier isolating data belonging to distinct organizations in a multi-tenant deployment. | `tenant_id` |
| **Transactional Outbox** | An atomic database queue storing domain events before asynchronous publishing to BullMQ. | `outbox_events` |
| **Vertical Slice** | A cohesive, self-contained implementation unit encompassing action, contract, domain, and tests. | `Slice` |
