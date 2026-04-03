import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata, SchedulePickerResult, TimeSlot } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Find a slot by its slotId */
function findSlotById(slots: TimeSlot[], slotId: string): TimeSlot | undefined {
  return slots.find((s) => s.slotId === slotId);
}

/** Find a slot by 1-based index */
function findSlotByIndex(slots: TimeSlot[], index: number): TimeSlot | undefined {
  if (index < 1 || index > slots.length) {
    return undefined;
  }
  return slots[index - 1];
}

/** Build a SchedulePickerResult from a matched slot */
function buildResult(slot: TimeSlot): SchedulePickerResult {
  return {
    date: '',
    time: slot.startTime,
    slotId: slot.slotId,
  };
}

export class SchedulePickerFieldHandler implements FieldHandler {
  readonly fieldType = 'SchedulePicker' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };
      const slots = metadata.availableSlots ?? [];

      const buttons = slots
        .filter((slot) => slot.available)
        .map((slot) => [
          {
            text: slot.label ?? `${slot.startTime}-${slot.endTime}`,
            callback_data: `ie:${renderCtx.formId}:${String(renderCtx.fieldIndex)}:slot:${slot.slotId ?? slot.startTime}`,
          },
        ]);

      await ctx.reply(metadata.i18nKey, { reply_markup: { inline_keyboard: buttons } });

      const response = await conv.waitFor('callback_query:data');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string; data?: string };
    const slots = metadata.availableSlots ?? [];

    if (msg.data) {
      return this.parseCallbackData(msg.data, slots);
    }

    if (msg.text) {
      return this.parseTextIndex(msg.text, slots);
    }

    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'No text or callback data in message',
      }),
    );
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const result = value as SchedulePickerResult;
    const slots = metadata.availableSlots;

    if (!slots || slots.length === 0) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.SCHEDULE_NO_SLOTS, {
          fieldType: this.fieldType,
          reason: 'No available slots configured',
        }),
      );
    }

    const matched = this.findMatchingSlot(result, slots);
    if (!matched || !matched.available) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.SCHEDULE_SLOT_UNAVAILABLE, {
          fieldType: this.fieldType,
          reason: 'Selected slot is not available',
          slotId: result.slotId,
        }),
      );
    }

    return ok(result);
  }

  /** Parse callback data format "slot:{slotId}" */
  private parseCallbackData(data: string, slots: TimeSlot[]): Result<unknown, AppError> {
    if (!data.startsWith('slot:')) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid callback data format',
        }),
      );
    }

    const slotId = data.slice(5);
    const slot = findSlotById(slots, slotId);
    if (!slot) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Slot not found',
          slotId,
        }),
      );
    }

    return ok(buildResult(slot));
  }

  /** Parse text as 1-based slot index */
  private parseTextIndex(text: string, slots: TimeSlot[]): Result<unknown, AppError> {
    const index = parseInt(text.trim(), 10);
    if (isNaN(index)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid slot selection',
        }),
      );
    }

    const slot = findSlotByIndex(slots, index);
    if (!slot) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Slot index out of range',
          index,
        }),
      );
    }

    return ok(buildResult(slot));
  }

  /** Find a slot matching the result by slotId or time */
  private findMatchingSlot(result: SchedulePickerResult, slots: TimeSlot[]): TimeSlot | undefined {
    if (result.slotId) {
      return findSlotById(slots, result.slotId);
    }
    return slots.find((s) => s.startTime === result.time);
  }
}
