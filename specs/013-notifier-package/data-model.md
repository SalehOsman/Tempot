# Notifier Package Data Model

## NotificationTarget

Represents the public recipient selection.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `kind` | `user | users | role | broadcast` | Target strategy |
| `userId` | `string` | Required when kind is `user` |
| `userIds` | `readonly string[]` | Required when kind is `users` |
| `role` | `string` | Required when kind is `role` |

## NotificationPayload

Represents the message template and delivery options.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `templateKey` | `string` | Required i18n key |
| `variables` | `Record<string, unknown>` | Optional interpolation data |
| `locale` | `string` | Optional requested locale |
| `silent` | `boolean` | Maps to Telegram silent delivery |
| `priority` | `low | normal | high` | Queue priority hint |
| `metadata` | `Record<string, string>` | Trace context for audit/events |

## NotificationRecipient

Resolved delivery destination.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `userId` | `string` | Domain user identifier |
| `chatId` | `string` | Telegram chat identifier or delivery destination |
| `locale` | `string` | Optional recipient locale |
| `role` | `string` | Optional role label |

## NotificationJobData

One queue job for one recipient.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Generated job payload ID |
| `recipient` | `NotificationRecipient` | Delivery target |
| `templateKey` | `string` | i18n key |
| `variables` | `Record<string, unknown>` | Template variables |
| `locale` | `string` | Effective locale if known |
| `silent` | `boolean` | Silent delivery flag |
| `priority` | `NotificationPriority` | Priority hint |
| `metadata` | `Record<string, string>` | Trace metadata |
| `createdAt` | `string` | ISO timestamp |

## NotificationAttempt

Audit sink record for one delivery attempt.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `jobId` | `string` | Queue payload ID |
| `userId` | `string` | Recipient user |
| `templateKey` | `string` | Template key |
| `status` | `success | failed` | Attempt outcome |
| `errorCode` | `string` | Present on failure |
| `referenceCode` | `string` | Optional external reference |
| `attemptedAt` | `string` | ISO timestamp |

## Ports

| Port | Responsibility |
| ---- | -------------- |
| `RecipientResolver` | Resolves targets into recipients |
| `NotificationQueuePort` | Enqueues one or many jobs |
| `TemplateRenderer` | Renders i18n templates |
| `DeliveryAdapter` | Sends rendered messages |
| `DeliveryAuditSink` | Records attempts |
| `NotificationEventPublisher` | Publishes notification events |
| `NotifierLogger` | Structured operational logging |
