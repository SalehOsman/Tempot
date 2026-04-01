# Data Model: Session Manager

## Entities

### `Session`

Represents the unified state of a user's interaction within a specific chat.

**Primary Key:** Composite of `userId` and `chatId`.

| Field                | Type                                     | Description                                          | Constraints / Validation                        |
| -------------------- | ---------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `userId`             | `string` (UUID/Snowflake)                | The unique identifier of the user                    | Required, Indexed                               |
| `chatId`             | `string`                                 | The Telegram chat ID                                 | Required, Indexed                               |
| `role`               | `Enum (GUEST, USER, ADMIN, SUPER_ADMIN)` | User's role for CASL RBAC                            | Required, Default: `GUEST`                      |
| `status`             | `Enum (ACTIVE, BANNED, PENDING)`         | The user's account status                            | Required, Default: `ACTIVE`                     |
| `language`           | `string`                                 | User's preferred language code                       | Required, Default: `ar-EG`                      |
| `activeConversation` | `string \| null`                         | The name/ID of the current multi-step conversation   | Optional                                        |
| `metadata`           | `JSON`                                   | Arbitrary hierarchical data for form state, etc.     | Optional, strictly typed at access via generics |
| `schemaVersion`      | `number`                                 | Version of the session data structure for migrations | Required, Default: `1`                          |
| `version`            | `number`                                 | Optimistic Concurrency Control counter               | Required, Auto-increment on update              |
| `createdAt`          | `Date`                                   | Timestamp of session creation                        | Required                                        |
| `updatedAt`          | `Date`                                   | Timestamp of last session update                     | Required                                        |

## Relationships

- `Session` belongs to a `User` (referenced by `userId`).
- Depending on the architecture, `Session` could be isolated or related to `Chat` (referenced by `chatId`).

## State Transitions

- **Creation:** A session is implicitly created with default values (GUEST role, `ar-EG` language, etc.) upon the first interaction if it doesn't exist.
- **Update:** Any modification increments the `version` field. Concurrent modifications check `version` to ensure no lost updates.
- **Expiration:** Redis entries have a sliding TTL (e.g., 24 hours). Expired Redis sessions are reconstructed from Postgres on the next interaction.

> **Note:** Session reconstruction from Postgres is an aspirational design goal. Current implementation falls back to in-memory temporary storage when Redis sessions expire. A dedicated FR and task are needed to implement Postgres-backed reconstruction. [NOT IMPLEMENTED]

## Storage Mechanisms

- **Redis Representation:** Stored as a serialized JSON string or Redis Hash (Hash preferred for partial updates, but JSON string is simpler for unified serialization). Key format: `session:{userId}:{chatId}`.
- **Postgres Representation:** Stored in the relational DB using the Prisma schema, with `metadata` as a `JSONB` column.
