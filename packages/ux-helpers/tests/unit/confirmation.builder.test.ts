import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import { createConfirmation } from '../../src/keyboards/confirmation.builder.js';

describe('createConfirmation', () => {
  it('should create keyboard with cancel and confirm buttons', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'inv.del',
    });
    expect(result.isOk()).toBe(true);
    const { keyboard } = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as {
        inline_keyboard: { text: string; callback_data: string }[][];
      }
    ).inline_keyboard;
    expect(rows).toHaveLength(1);
    const buttons = rows[0]!;
    expect(buttons).toHaveLength(2);
  });

  it('should put cancel first and confirm second (RTL ordering)', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'inv.del',
    });
    expect(result.isOk()).toBe(true);
    const { keyboard } = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as {
        inline_keyboard: { text: string; callback_data: string }[][];
      }
    ).inline_keyboard;
    const buttons = rows[0]!;
    // First button = cancel
    expect(buttons[0]!.text).toBe('common.buttons.cancel');
    expect(buttons[0]!.callback_data).toBe('inv.del:cancel');
    // Second button = confirm with action name
    expect(buttons[1]!.text).toBe('invoice.delete_action');
    expect(buttons[1]!.callback_data).toContain('inv.del:confirm:');
  });

  it('should encode expiry timestamp in confirm callback', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'inv.del',
    });
    expect(result.isOk()).toBe(true);
    const { keyboard } = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as {
        inline_keyboard: { text: string; callback_data: string }[][];
      }
    ).inline_keyboard;
    const confirmCallback = rows[0]![1]!.callback_data;
    const parts = confirmCallback.split(':');
    // Should be: inv.del:confirm:{timestamp}
    expect(parts).toHaveLength(3);
    const timestamp = parseInt(parts[2]!, 10);
    expect(timestamp).toBeGreaterThan(Date.now() / 1000);
  });

  it('should use custom cancel key when provided', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      cancelKey: 'custom.cancel',
      callbackPrefix: 'inv.del',
    });
    expect(result.isOk()).toBe(true);
    const { keyboard } = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as {
        inline_keyboard: { text: string; callback_data: string }[][];
      }
    ).inline_keyboard;
    expect(rows[0]![0]!.text).toBe('custom.cancel');
  });

  it('should include warningText when isIrreversible is true', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'inv.del',
      isIrreversible: true,
    });
    expect(result.isOk()).toBe(true);
    const { warningText } = result._unsafeUnwrap();
    expect(warningText).toBe('common.confirmation.irreversible_warning');
  });

  it('should not include warningText when isIrreversible is false or undefined', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'inv.del',
    });
    expect(result.isOk()).toBe(true);
    const { warningText } = result._unsafeUnwrap();
    expect(warningText).toBeUndefined();
  });

  it('should return err when callback data exceeds 64 bytes', () => {
    const result = createConfirmation({
      actionNameKey: 'invoice.delete_action',
      callbackPrefix: 'a'.repeat(55), // too long with :confirm:{timestamp}
    });
    expect(result.isErr()).toBe(true);
  });
});
