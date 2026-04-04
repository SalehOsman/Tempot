import { describe, it, expect, vi } from 'vitest';
import { buildActionButtons, ACTION_CALLBACKS } from '../../src/runner/action-buttons.builder.js';
import type { ActionButtonContext } from '../../src/runner/action-buttons.builder.js';
import { encodeFormCallback } from '../../src/utils/callback-data.helper.js';

/** Default context factory */
function makeContext(overrides: Partial<ActionButtonContext> = {}): ActionButtonContext {
  return {
    formId: 'abc12345',
    fieldIndex: 0,
    isOptional: false,
    isFirstField: true,
    allowCancel: false,
    ...overrides,
  };
}

describe('buildActionButtons', () => {
  const t = (key: string): string => key;

  describe('Skip button', () => {
    it('shows Skip button when field is optional', () => {
      const ctx = makeContext({ isOptional: true });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const skipButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.SKIP));
      expect(skipButton).toBeDefined();
      expect(skipButton!.text).toBe('input-engine.actions.skip');
    });

    it('hides Skip button when field is not optional', () => {
      const ctx = makeContext({ isOptional: false });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const skipButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.SKIP));
      expect(skipButton).toBeUndefined();
    });
  });

  describe('Back button', () => {
    it('hides Back button when isFirstField is true', () => {
      const ctx = makeContext({ isFirstField: true });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const backButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.BACK));
      expect(backButton).toBeUndefined();
    });

    it('shows Back button when isFirstField is false', () => {
      const ctx = makeContext({ isFirstField: false });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const backButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.BACK));
      expect(backButton).toBeDefined();
      expect(backButton!.text).toBe('input-engine.actions.back');
    });
  });

  describe('Cancel button', () => {
    it('shows Cancel button when allowCancel is true', () => {
      const ctx = makeContext({ allowCancel: true });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const cancelButton = allButtons.find((btn) =>
        btn.callbackData.includes(ACTION_CALLBACKS.CANCEL),
      );
      expect(cancelButton).toBeDefined();
      expect(cancelButton!.text).toBe('input-engine.actions.cancel');
    });

    it('hides Cancel button when allowCancel is false', () => {
      const ctx = makeContext({ allowCancel: false });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);
      const cancelButton = allButtons.find((btn) =>
        btn.callbackData.includes(ACTION_CALLBACKS.CANCEL),
      );
      expect(cancelButton).toBeUndefined();
    });
  });

  describe('i18n integration', () => {
    it('calls t() for all button text', () => {
      const tSpy = vi.fn((key: string) => key);
      const ctx = makeContext({
        isOptional: true,
        isFirstField: false,
        allowCancel: true,
      });

      buildActionButtons(ctx, tSpy);

      expect(tSpy).toHaveBeenCalledWith('input-engine.actions.back');
      expect(tSpy).toHaveBeenCalledWith('input-engine.actions.skip');
      expect(tSpy).toHaveBeenCalledWith('input-engine.actions.cancel');
    });
  });

  describe('callback data format', () => {
    it('uses encodeFormCallback format for all buttons', () => {
      const ctx = makeContext({
        formId: 'test1234',
        fieldIndex: 3,
        isOptional: true,
        isFirstField: false,
        allowCancel: true,
      });
      const rows = buildActionButtons(ctx, t);

      const allButtons = rows.flatMap((row) => row.buttons);

      const backButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.BACK));
      expect(backButton!.callbackData).toBe(
        encodeFormCallback('test1234', 3, ACTION_CALLBACKS.BACK),
      );

      const skipButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.SKIP));
      expect(skipButton!.callbackData).toBe(
        encodeFormCallback('test1234', 3, ACTION_CALLBACKS.SKIP),
      );

      const cancelButton = allButtons.find((btn) =>
        btn.callbackData.includes(ACTION_CALLBACKS.CANCEL),
      );
      expect(cancelButton!.callbackData).toBe(
        encodeFormCallback('test1234', 3, ACTION_CALLBACKS.CANCEL),
      );
    });
  });

  describe('default translate function', () => {
    it('returns raw key when no t function provided', () => {
      const ctx = makeContext({
        isOptional: true,
        isFirstField: false,
        allowCancel: true,
      });
      const rows = buildActionButtons(ctx);

      const allButtons = rows.flatMap((row) => row.buttons);
      const skipButton = allButtons.find((btn) => btn.callbackData.includes(ACTION_CALLBACKS.SKIP));
      expect(skipButton!.text).toBe('input-engine.actions.skip');
    });
  });

  describe('row structure', () => {
    it('returns empty array when no buttons are needed', () => {
      const ctx = makeContext({
        isOptional: false,
        isFirstField: true,
        allowCancel: false,
      });
      const rows = buildActionButtons(ctx, t);
      expect(rows).toEqual([]);
    });

    it('puts Cancel button in its own row', () => {
      const ctx = makeContext({
        isOptional: true,
        isFirstField: false,
        allowCancel: true,
      });
      const rows = buildActionButtons(ctx, t);

      // Last row should contain only the cancel button
      const lastRow = rows[rows.length - 1];
      expect(lastRow.buttons).toHaveLength(1);
      expect(lastRow.buttons[0].callbackData).toContain(ACTION_CALLBACKS.CANCEL);
    });

    it('groups Back and Skip buttons in the same row', () => {
      const ctx = makeContext({
        isOptional: true,
        isFirstField: false,
        allowCancel: false,
      });
      const rows = buildActionButtons(ctx, t);

      expect(rows).toHaveLength(1);
      expect(rows[0].buttons).toHaveLength(2);

      const callbackValues = rows[0].buttons.map((btn) => btn.callbackData);
      expect(callbackValues.some((cd) => cd.includes(ACTION_CALLBACKS.BACK))).toBe(true);
      expect(callbackValues.some((cd) => cd.includes(ACTION_CALLBACKS.SKIP))).toBe(true);
    });
  });
});
