import { describe, it, expect } from 'vitest';
import { createReplyKeyboard } from '../../src/keyboards/reply.builder.js';

describe('Reply Keyboard Builder', () => {
  it('should create a keyboard with a single button', () => {
    const kb = createReplyKeyboard();
    const result = kb.button('\u2705 OK');
    expect(result.isOk()).toBe(true);
    const buildResult = result._unsafeUnwrap().build();
    expect(buildResult.isOk()).toBe(true);
  });

  it('should return err for empty label', () => {
    const kb = createReplyKeyboard();
    const result = kb.button('');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for label exceeding reply char limit', () => {
    const kb = createReplyKeyboard();
    const longArabic = '\u2705 ' + '\u0639'.repeat(16); // > 15 for reply Arabic
    const result = kb.button(longArabic);
    expect(result.isErr()).toBe(true);
  });

  it('should auto-wrap rows at 2 buttons', () => {
    const kb = createReplyKeyboard();
    let current = kb;
    for (let i = 0; i < 3; i++) {
      const result = current.button(`\u2705 B${i}`);
      expect(result.isOk()).toBe(true);
      current = result._unsafeUnwrap();
    }
    const built = current.build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    // grammY Keyboard stores rows in keyboard property
    const rows = (keyboard as unknown as { keyboard: unknown[][] }).keyboard;
    expect(rows.length).toBeGreaterThanOrEqual(2); // 3 buttons, max 2/row
  });

  it('should give long labels their own row', () => {
    const kb = createReplyKeyboard();
    const r1 = kb.button('\u2705 Hi');
    expect(r1.isOk()).toBe(true);
    // Arabic long: > 7 chars stripped for reply
    const longLabel = '\u2705 ' + '\u0639'.repeat(10); // 10 > 7, "long" for reply
    const r2 = r1._unsafeUnwrap().button(longLabel);
    expect(r2.isOk()).toBe(true);
    const built = r2._unsafeUnwrap().build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    const rows = (keyboard as unknown as { keyboard: unknown[][] }).keyboard;
    expect(rows.length).toBe(2);
  });

  it('should support oneTime()', () => {
    const kb = createReplyKeyboard();
    const result = kb.button('\u2705 A');
    expect(result.isOk()).toBe(true);
    const withOneTime = result._unsafeUnwrap().oneTime();
    const built = withOneTime.build();
    expect(built.isOk()).toBe(true);
    // grammY Keyboard has one_time_keyboard property
    const keyboard = built._unsafeUnwrap();
    expect((keyboard as unknown as { one_time_keyboard?: boolean }).one_time_keyboard).toBe(true);
  });

  it('should support resized()', () => {
    const kb = createReplyKeyboard();
    const result = kb.button('\u2705 A');
    expect(result.isOk()).toBe(true);
    const withResize = result._unsafeUnwrap().resized();
    const built = withResize.build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    expect((keyboard as unknown as { resize_keyboard?: boolean }).resize_keyboard).toBe(true);
  });

  it('should expose toGrammyKeyboard() for direct access', () => {
    const kb = createReplyKeyboard();
    const grammy = kb.toGrammyKeyboard();
    expect(grammy).toBeDefined();
    expect(grammy.text).toBeDefined();
  });

  it('should support manual row() calls', () => {
    const kb = createReplyKeyboard();
    const r1 = kb.button('\u2705 A');
    expect(r1.isOk()).toBe(true);
    const afterRow = r1._unsafeUnwrap().row();
    const r2 = afterRow.button('\u2705 B');
    expect(r2.isOk()).toBe(true);
    const built = r2._unsafeUnwrap().build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    const rows = (keyboard as unknown as { keyboard: unknown[][] }).keyboard;
    expect(rows.length).toBe(2);
  });

  it('should be chainable via Result pattern', () => {
    const kb = createReplyKeyboard();
    const result = kb
      .button('\u2705 A')
      .map((k) => k.button('\u2705 B'))
      .andThen((r) => r)
      .map((k) => k.build())
      .andThen((r) => r);
    expect(result.isOk()).toBe(true);
  });
});
