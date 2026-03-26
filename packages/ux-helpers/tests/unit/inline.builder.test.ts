import { describe, it, expect } from 'vitest';
import { createInlineKeyboard } from '../../src/keyboards/inline.builder.js';

describe('Inline Keyboard Builder', () => {
  it('should create a keyboard with a single button', () => {
    const kb = createInlineKeyboard();
    const result = kb.button({ label: '\u2705 OK', callbackData: 'ok' });
    expect(result.isOk()).toBe(true);
    const buildResult = result._unsafeUnwrap().build();
    expect(buildResult.isOk()).toBe(true);
  });

  it('should return err for empty label', () => {
    const kb = createInlineKeyboard();
    const result = kb.button({ label: '', callbackData: 'ok' });
    expect(result.isErr()).toBe(true);
  });

  it('should return err for label exceeding char limit', () => {
    const kb = createInlineKeyboard();
    const longLabel = '\u2705 ' + '\u0639'.repeat(21); // Arabic > 20
    const result = kb.button({ label: longLabel, callbackData: 'ok' });
    expect(result.isErr()).toBe(true);
  });

  it('should return err for callback data exceeding 64 bytes', () => {
    const kb = createInlineKeyboard();
    const result = kb.button({
      label: '\u2705 OK',
      callbackData: 'a'.repeat(65),
    });
    expect(result.isErr()).toBe(true);
  });

  it('should auto-wrap rows at 3 buttons', () => {
    const kb = createInlineKeyboard();
    // Add 4 short buttons
    let current = kb;
    for (let i = 0; i < 4; i++) {
      const result = current.button({
        label: `\u2705 B${i}`,
        callbackData: `btn:${i}`,
      });
      expect(result.isOk()).toBe(true);
      current = result._unsafeUnwrap();
    }
    const built = current.build();
    expect(built.isOk()).toBe(true);
    // The grammY keyboard should have the buttons arranged in rows
    const keyboard = built._unsafeUnwrap();
    // grammY InlineKeyboard stores rows internally
    const rows = (keyboard as unknown as { inline_keyboard: unknown[][] }).inline_keyboard;
    expect(rows.length).toBeGreaterThanOrEqual(2); // 4 buttons, max 3/row = at least 2 rows
  });

  it('should give long labels their own row', () => {
    const kb = createInlineKeyboard();
    // First a short button
    const r1 = kb.button({ label: '\u2705 Short', callbackData: 'short' });
    expect(r1.isOk()).toBe(true);
    // Then a long Arabic button (> 10 chars stripped = long)
    const longLabel = '\u2705 ' + '\u0639'.repeat(15); // 15 > 10, so "long"
    const r2 = r1._unsafeUnwrap().button({
      label: longLabel,
      callbackData: 'long',
    });
    expect(r2.isOk()).toBe(true);
    const built = r2._unsafeUnwrap().build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    const rows = (keyboard as unknown as { inline_keyboard: unknown[][] }).inline_keyboard;
    // Short button should be on row 1, long on row 2
    expect(rows.length).toBe(2);
  });

  it('should support manual row() calls', () => {
    const kb = createInlineKeyboard();
    const r1 = kb.button({ label: '\u2705 A', callbackData: 'a' });
    expect(r1.isOk()).toBe(true);
    const afterRow = r1._unsafeUnwrap().row();
    const r2 = afterRow.button({ label: '\u2705 B', callbackData: 'b' });
    expect(r2.isOk()).toBe(true);
    const built = r2._unsafeUnwrap().build();
    expect(built.isOk()).toBe(true);
    const keyboard = built._unsafeUnwrap();
    const rows = (keyboard as unknown as { inline_keyboard: unknown[][] }).inline_keyboard;
    expect(rows.length).toBe(2);
  });

  it('should expose toGrammyKeyboard() for direct access', () => {
    const kb = createInlineKeyboard();
    const grammy = kb.toGrammyKeyboard();
    expect(grammy).toBeDefined();
    // Should be a grammY InlineKeyboard instance
    expect(grammy.text).toBeDefined(); // has .text method
  });

  it('should be chainable via Result pattern', () => {
    const kb = createInlineKeyboard();
    const result = kb
      .button({ label: '\u2705 A', callbackData: 'a' })
      .map((k) => k.button({ label: '\u2705 B', callbackData: 'b' }))
      .andThen((r) => r)
      .map((k) => k.build())
      .andThen((r) => r);
    expect(result.isOk()).toBe(true);
  });
});
