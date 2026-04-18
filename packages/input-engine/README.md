# @tempot/input-engine

> Dynamic form engine built on grammY Conversations + Zod. 22 built-in field types. Write a schema, not a conversation.

## Purpose

Eliminates repetitive conversation code. Modules define a Zod-like schema with field types — the engine handles the entire conversation: asking questions, validating input, retrying on failure, cancellation, timeouts, and partial saves.

Disabled by default. Enable per-module with `features.hasInputEngine: true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package                   | Purpose                        |
| ------------------------- | ------------------------------ |
| `@grammyjs/conversations` | Conversation flow engine       |
| `zod` 3.x                 | Field validation               |
| `@tempot/ux-helpers`      | Buttons and feedback messages  |
| `@tempot/i18n-core`       | All field text from i18n keys  |
| `@tempot/session-manager` | Partial save to Redis          |
| `@tempot/ai-core`         | AIExtractorField (optional)    |
| `@tempot/storage-engine`  | Media field uploads (optional) |

## 22 Field Types

| Category   | Types                                                               |
| ---------- | ------------------------------------------------------------------- |
| Text       | `ShortText`, `LongText`, `Email`, `Phone`, `URL`, `RegexValidated`  |
| Numbers    | `Integer`, `Float`, `Currency`, `Percentage`                        |
| Choice     | `SingleChoice`, `MultipleChoice`, `BooleanToggle`, `SearchableList` |
| Time/Place | `DatePicker`, `TimePicker`, `Location`                              |
| Media      | `Photo`, `Document`, `Video`, `Contact`                             |
| Smart      | `ConditionalField`, `AIExtractorField`, `GeoSelectField`            |

## API

```typescript
import { InputEngine } from '@tempot/input-engine';

// Define schema
const createInvoiceSchema = InputEngine.schema({
  customerName: { type: 'ShortText', i18nKey: 'invoice.fields.customer_name', minLength: 2 },
  amount: { type: 'Currency', i18nKey: 'invoice.fields.amount', min: 1 },
  dueDate: { type: 'DatePicker', i18nKey: 'invoice.fields.due_date' },
  notes: { type: 'LongText', i18nKey: 'invoice.fields.notes', required: false },
});

// Run the form
const result = await InputEngine.runForm(ctx, createInvoiceSchema, {
  timeout: 600, // 10 minutes
  allowCancel: true,
  partialSave: true, // resume if user cancels mid-way
});

if (result.success) {
  await invoiceRepo.create(result.data);
} else {
  // result.reason: 'cancelled' | 'timeout' | 'error'
}
```

## Status

⏳ **Not yet implemented** — Phase 4
