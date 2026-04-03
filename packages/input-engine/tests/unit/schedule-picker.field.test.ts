import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulePickerFieldHandler } from '../../src/fields/time-place/schedule-picker.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata, TimeSlot } from '../../src/input-engine.types.js';

const AVAILABLE_SLOTS: TimeSlot[] = [
  { startTime: '09:00', endTime: '09:30', slotId: 'slot-1', available: true },
  { startTime: '10:00', endTime: '10:30', slotId: 'slot-2', available: true },
  { startTime: '11:00', endTime: '11:30', slotId: 'slot-3', available: false },
];

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'SchedulePicker',
    i18nKey: 'test.schedulePicker',
    availableSlots: AVAILABLE_SLOTS,
    ...overrides,
  } as FieldMetadata;
}

describe('SchedulePickerFieldHandler', () => {
  let handler: SchedulePickerFieldHandler;

  beforeEach(() => {
    handler = new SchedulePickerFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('SchedulePicker');
  });

  describe('render', () => {
    it('sends available slots as inline keyboard', async () => {
      const mockResponse = { callback_query: { data: 'ie:f1:0:slot:slot-1' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };

      const result = await handler.render(
        { conversation: mockConv, ctx: mockCtx, formData: {}, formId: 'f1', fieldIndex: 0 },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        'test.schedulePicker',
        expect.objectContaining({
          reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
        }),
      );
      expect(mockConv.waitFor).toHaveBeenCalledWith('callback_query:data');
    });
  });

  describe('parseResponse', () => {
    it('parses slot selection by slotId from callback data', () => {
      const result = handler.parseResponse({ data: 'slot:slot-1' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        date: '',
        time: '09:00',
        slotId: 'slot-1',
      });
    });

    it('parses slot selection by index from text', () => {
      const result = handler.parseResponse({ text: '1' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        date: '',
        time: '09:00',
        slotId: 'slot-1',
      });
    });

    it('returns err for missing text and data', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for out of range slot index', () => {
      const result = handler.parseResponse({ text: '10' }, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for available slot', () => {
      const value = { date: '2025-03-15', time: '09:00', slotId: 'slot-1' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err for unavailable slot', () => {
      const value = { date: '2025-03-15', time: '11:00', slotId: 'slot-3' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.SCHEDULE_SLOT_UNAVAILABLE);
    });

    it('returns err when no slots configured', () => {
      const value = { date: '2025-03-15', time: '09:00', slotId: 'slot-1' };
      const result = handler.validate(value, undefined, createMeta({ availableSlots: undefined }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.SCHEDULE_NO_SLOTS);
    });
  });
});
