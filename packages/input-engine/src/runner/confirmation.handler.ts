import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError, type AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { buildSchemaMetadataMap } from './field-metadata.util.js';
import { shouldRenderField } from './condition.evaluator.js';
import { buildConfirmationSummary, CONFIRMATION_ACTIONS } from './confirmation.renderer.js';
import { decodeFormCallback, extractCallbackData } from '../utils/callback-data.helper.js';
import { iterateFields } from './field.iterator.js';
import type { FormRunnerDeps, FormRunnerInput, FormProgress } from './form.runner.js';
import type { TranslateFunction } from '../input-engine.types.js';

/** Typed shape for the conversation object used internally */
interface ConversationShape {
  external: (fn: () => Promise<unknown>) => Promise<unknown>;
  waitFor: (filter: string) => Promise<unknown>;
}

/** Typed shape for the context object used internally */
interface CtxShape {
  reply: (text: string, options?: unknown) => Promise<unknown>;
}

/** Single inline keyboard button */
export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

/** Inline keyboard markup for Telegram reply */
export interface InlineKeyboardMarkup {
  reply_markup: {
    inline_keyboard: InlineKeyboardButton[][];
  };
}

/** Build inline keyboard for confirmation (Confirm / Edit / Cancel) */
function buildConfirmationKeyboard(t: TranslateFunction): InlineKeyboardMarkup {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: t('input-engine.confirmation.confirm'),
            callback_data: CONFIRMATION_ACTIONS.CONFIRM,
          },
          {
            text: t('input-engine.confirmation.edit'),
            callback_data: CONFIRMATION_ACTIONS.EDIT,
          },
          {
            text: t('input-engine.confirmation.cancel'),
            callback_data: CONFIRMATION_ACTIONS.CANCEL,
          },
        ],
      ],
    },
  };
}

/** Build inline keyboard for field selection during edit */
function buildFieldSelectionKeyboard(
  schema: z.ZodObject<z.ZodRawShape>,
  progress: FormProgress,
  t: TranslateFunction = (key: string) => key,
): InlineKeyboardMarkup {
  const fieldNames = Object.keys(schema.shape);
  const metaMap = buildSchemaMetadataMap(schema);
  const buttons = fieldNames
    .filter((name) => progress.completedFieldNames.includes(name))
    .map((name, idx) => ({
      text: t(metaMap.get(name)?.i18nKey ?? name),
      callback_data: `ie:${progress.formId}:${String(idx)}:${name}`,
    }));

  return {
    reply_markup: {
      inline_keyboard: buttons.map((b) => [b]),
    },
  };
}

/** Context for the confirmation loop */
interface ConfirmationContext {
  input: FormRunnerInput;
  deps: FormRunnerDeps;
  progress: FormProgress;
}

/** Display the summary and wait for user action */
async function displayAndWaitForAction(ctx: ConfirmationContext): AsyncResult<string, AppError> {
  const { input, deps, progress } = ctx;
  const conv = input.conversation as ConversationShape;
  const gramCtx = input.ctx as CtxShape;
  const t: TranslateFunction = deps.t ?? ((key: string) => key);
  const metaMap = buildSchemaMetadataMap(input.schema);

  progress.startTime = Date.now();

  const chunks = buildConfirmationSummary(progress.formData, metaMap, t);
  const keyboard = buildConfirmationKeyboard(t);

  await conv.external(async () => {
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      await gramCtx.reply(chunks[i]!, isLast ? keyboard : undefined);
    }
  });

  const response = await conv.waitFor('callback_query:data');
  const action = extractCallbackData(response);

  if (!action) {
    return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, { reason: 'No action' }));
  }
  return ok(action);
}

/** Handle the edit flow: select field, re-enter, re-evaluate conditions */
async function handleEditAction(ctx: ConfirmationContext): AsyncResult<void, AppError> {
  const { input, deps, progress } = ctx;
  const conv = input.conversation as ConversationShape;
  const gramCtx = input.ctx as CtxShape;
  const t: TranslateFunction = deps.t ?? ((key: string) => key);

  const selKeyboard = buildFieldSelectionKeyboard(input.schema, progress, t);
  await conv.external(async () => {
    await gramCtx.reply(t('input-engine.confirmation.select_field'), selKeyboard);
  });

  const response = await conv.waitFor('callback_query:data');
  const cbData = extractCallbackData(response);
  if (!cbData) {
    return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, { reason: 'No selection' }));
  }

  const decoded = decodeFormCallback(cbData);
  if (decoded.isErr()) return err(decoded.error);

  const fieldName = decoded.value.value;
  return reEnterField(ctx, fieldName);
}

/** Re-enter a specific field and re-evaluate conditions afterward */
async function reEnterField(
  ctx: ConfirmationContext,
  fieldName: string,
): AsyncResult<void, AppError> {
  const { input, deps, progress } = ctx;
  const fieldNames = Object.keys(input.schema.shape);
  const editSchemaIdx = fieldNames.indexOf(fieldName);

  const idx = progress.completedFieldNames.indexOf(fieldName);
  if (idx !== -1) {
    progress.completedFieldNames.splice(idx, 1);
    progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
  }

  // D27: Skip fields before edit point to prevent newly-visible pre-edit fields
  const tempSkipped: string[] = [];
  for (let i = 0; i < editSchemaIdx; i++) {
    const fn = fieldNames[i]!;
    if (!progress.completedFieldNames.includes(fn)) {
      progress.completedFieldNames.push(fn);
      tempSkipped.push(fn);
    }
  }

  const iterResult = await iterateFields(input, deps, progress);

  // Remove temporary skips
  for (const fn of tempSkipped) {
    const tempIdx = progress.completedFieldNames.indexOf(fn);
    if (tempIdx !== -1) progress.completedFieldNames.splice(tempIdx, 1);
  }

  if (iterResult.isErr()) return iterResult;
  removeConditionallyHiddenFields(input.schema, progress);
  return ok(undefined);
}

/** Remove fields from formData/completed that no longer pass conditions */
function removeConditionallyHiddenFields(
  schema: z.ZodObject<z.ZodRawShape>,
  progress: FormProgress,
): void {
  const metaMap = buildSchemaMetadataMap(schema);
  for (const [name, metadata] of metaMap) {
    if (!shouldRenderField(metadata, progress.formData)) {
      delete progress.formData[name];
      const idx = progress.completedFieldNames.indexOf(name);
      if (idx !== -1) {
        progress.completedFieldNames.splice(idx, 1);
        progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
      }
    }
  }
}

/** Main confirmation loop: display summary, handle user actions */
export async function handleConfirmationLoop(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const ctx: ConfirmationContext = { input, deps, progress };
  let editing = true;

  while (editing) {
    const actionResult = await displayAndWaitForAction(ctx);
    if (actionResult.isErr()) return err(actionResult.error);

    const action = actionResult.value;

    if (action === CONFIRMATION_ACTIONS.CONFIRM) {
      return ok(undefined);
    }

    if (action === CONFIRMATION_ACTIONS.CANCEL) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED, {
          reason: 'user_cancel',
          stage: 'confirmation',
        }),
      );
    }

    if (action === CONFIRMATION_ACTIONS.EDIT) {
      const editResult = await handleEditAction(ctx);
      if (editResult.isErr()) return err(editResult.error);
      continue;
    }

    editing = false;
  }

  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
      reason: 'Unknown confirmation action',
    }),
  );
}
