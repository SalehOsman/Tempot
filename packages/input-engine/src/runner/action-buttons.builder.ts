import { encodeFormCallback } from '../utils/callback-data.helper.js';

/** Callback action constants */
export const ACTION_CALLBACKS = {
  SKIP: '__skip__',
  CANCEL: '__cancel__',
  BACK: '__back__',
  KEEP_CURRENT: '__keep_current__',
} as const;

/** Context for building action buttons */
export interface ActionButtonContext {
  formId: string;
  fieldIndex: number;
  isOptional: boolean;
  isFirstField: boolean;
  allowCancel: boolean;
  hasPreviousValue?: boolean;
}

/** A row of action buttons */
export interface ActionButtonRow {
  buttons: Array<{ text: string; callbackData: string }>;
}

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

/** Build action button rows based on field context. Pure function. */
export function buildActionButtons(
  ctx: ActionButtonContext,
  t: TranslateFunction = defaultT,
): ActionButtonRow[] {
  const rows: ActionButtonRow[] = [];
  const navButtons: Array<{ text: string; callbackData: string }> = [];

  if (!ctx.isFirstField) {
    navButtons.push({
      text: t('input-engine.actions.back'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.BACK),
    });
  }

  if (ctx.isOptional) {
    navButtons.push({
      text: t('input-engine.actions.skip'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.SKIP),
    });
  }

  if (ctx.hasPreviousValue) {
    navButtons.push({
      text: t('input-engine.actions.keep_current'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.KEEP_CURRENT),
    });
  }

  if (navButtons.length > 0) rows.push({ buttons: navButtons });

  if (ctx.allowCancel) {
    rows.push({
      buttons: [
        {
          text: t('input-engine.actions.cancel'),
          callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.CANCEL),
        },
      ],
    });
  }

  return rows;
}
