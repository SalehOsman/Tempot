# @tempot/input-engine

> Structured Telegram form runtime built on grammY Conversations and Zod.
> Modules declare schemas and field metadata; the engine manages prompts,
> validation, retries, cancellation, progress, partial saves, confirmation, and
> lifecycle events.

## Purpose

`@tempot/input-engine` is Tempot's default capability for structured multi-step
Telegram input. It exists so modules do not rebuild local conversation state
machines, ad hoc retry loops, or bespoke back/cancel handling.

Use it for:

- create and edit forms
- guided settings flows
- multi-field search criteria
- structured imports or review steps
- any Telegram interaction that requires repeated validation across steps

Do not replace it with a module-local map/state machine when the interaction can
be expressed as a form schema plus module-owned orchestration.

## Runtime Contract

The engine is production-implemented, but it needs the host bot runtime to own
grammY conversation middleware.

In Tempot:

1. `apps/bot-server` installs `conversations()` in the shared bot factory.
2. A Telegram-facing module registers its conversation with
   `createConversation(...)`.
3. Commands and inline buttons call `ctx.conversation.enter(...)`.
4. The conversation function calls `runForm(...)` with:
   - a Zod schema whose fields are annotated through `z.globalRegistry`
   - a `FieldHandlerRegistry`
   - module-provided dependencies such as i18n, event bus, logger, and prompt rendering

This preserves the project standard:

- commands are entry points
- inline menus are the primary navigation surface
- `@tempot/input-engine` is the default structured-input engine

## Status

Implemented and actively adopted. Spec #041 wires the runtime path in
`apps/bot-server` and migrates `bot-management` registration to the package-backed
flow pattern.

## Dependencies

| Package | Purpose |
| --- | --- |
| `@grammyjs/conversations` | Conversation host and replay model |
| `zod` 4.x | Schema definitions and field metadata registration |
| `@tempot/shared` | `Result` and `AppError` contracts |
| `@tempot/ux-helpers` | Reusable Telegram UX helpers |
| `@tempot/i18n-core` | User-facing translation keys |
| `@tempot/session-manager` | Optional partial-save persistence adapters |
| `@tempot/storage-engine` | Optional media upload support |
| `@tempot/ai-core` | Optional smart extraction support |

## 39 Supported Field Types

| Category | Types |
| --- | --- |
| Text | `ShortText`, `LongText`, `Email`, `Phone`, `URL`, `RegexValidated` |
| Numbers | `Integer`, `Float`, `Currency`, `Percentage`, `CurrencyAmount` |
| Choice | `SingleChoice`, `MultipleChoice`, `BooleanToggle`, `SearchableList` |
| Time and place | `DatePicker`, `TimePicker`, `Location`, `DateRange`, `SchedulePicker` |
| Media | `Photo`, `Document`, `Video`, `Audio`, `FileGroup`, `Contact` |
| Smart | `ConditionalField`, `AIExtractorField` |
| Geo | `GeoSelectField`, `GeoAddressField` |
| Identity | `NationalID`, `PassportNumber`, `IBAN`, `EgyptianMobile` |
| Interactive | `StarRating`, `MultiStepChoice`, `QRCode`, `Toggle`, `Tags` |

## Minimal Usage Shape

```typescript
import type { Context } from 'grammy';
import type { Conversation } from '@grammyjs/conversations';
import { ok } from 'neverthrow';
import { z } from 'zod';
import {
  buildActionButtons,
  FieldHandlerRegistry,
  ShortTextFieldHandler,
  runForm,
  type FieldMetadata,
} from '@tempot/input-engine';

function annotate(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}

const schema = z.object({
  displayName: annotate(z.string(), {
    fieldType: 'ShortText',
    i18nKey: 'example.prompt.display_name',
    minLength: 1,
  }),
});

export async function registrationConversation(
  conversation: Conversation<Context, Context>,
  ctx: Context,
): Promise<void> {
  const registry = new FieldHandlerRegistry();
  registry.register(new ShortTextFieldHandler());

  let activeConversation: string | undefined;
  const result = await runForm<{ displayName: string }>(
    { conversation, ctx, schema, options: { showConfirmation: false } },
    {
      registry,
      logger,
      eventBus,
      isEnabled: () => true,
      getActiveConversation: () => activeConversation,
      setActiveConversation: (value) => {
        activeConversation = value;
      },
      userId: String(ctx.from?.id ?? ''),
      chatId: ctx.chat?.id ?? 0,
      t,
      renderPrompt: async (renderCtx, metadata) => {
        const actions = buildActionButtons(
          {
            formId: renderCtx.formId,
            fieldIndex: renderCtx.fieldIndex,
            isOptional: metadata.optional === true,
            isFirstField: renderCtx.fieldIndex === 0,
            allowCancel: true,
            hasPreviousValue: renderCtx.previousValue !== undefined,
          },
          t,
        );

        await ctx.reply(t(metadata.i18nKey), {
          reply_markup: {
            inline_keyboard: actions.map((row) =>
              row.buttons.map((button) => ({
                text: button.text,
                callback_data: button.callbackData,
              })),
            ),
          },
        });
        return ok(await conversation.waitFor(['message:text', 'callback_query:data']));
      },
    },
  );

  if (result.isErr()) {
    await ctx.reply(t('example.error.form_failed'));
    return;
  }
}
```

The concrete logger, event bus, and translation implementations come from the
module's registered dependencies. The example only shows the package contract.

## Implementation Notes

- Field metadata is stored through `z.globalRegistry` under the
  `'input-engine'` key.
- Built-in handlers are registered explicitly so modules select only the field
  types they need.
- `renderPrompt` is the standard bridge for handlers that validate generic text
  input while the module owns the exact localized prompt.
- `buildActionButtons(...)` keeps back, cancel, skip, and keep-current actions
  package-backed even when a module supplies custom prompt rendering.
- Form completion returns a typed `Result`; domain persistence remains the
  module's responsibility.
- Cancellation, timeout, retry exhaustion, and duplicate active-form protection
  are handled by the package runner rather than by module-local state machines.
