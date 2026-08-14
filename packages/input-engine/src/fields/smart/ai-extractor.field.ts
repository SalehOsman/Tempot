import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { encodeFormCallback, decodeFormCallback } from '../../utils/callback-data.helper.js';
import type { AIExtractionClient, InputEngineLogger } from '../../input-engine.contracts.js';

const AI_ACTIONS = {
  ACCEPT: '__ai_accept__',
  EDIT: '__ai_edit__',
  MANUAL: '__ai_manual__',
} as const;

interface ExtractionConversation {
  external: <T>(fn: () => Promise<T> | T) => Promise<T>;
  waitFor: () => Promise<{ text?: string; caption?: string }>;
  waitForCallbackQuery: (filter: RegExp) => Promise<{ data: string }>;
}

interface ExtractionCtx {
  reply: (text: string, options?: Record<string, unknown>) => Promise<unknown>;
}

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

interface RenderDeps {
  conv: ExtractionConversation;
  ctx: ExtractionCtx;
  t: TranslateFn;
}

interface ExtractionParams {
  conv: ExtractionConversation;
  aiClient: AIExtractionClient;
  inputText: string;
  targetFields: string[];
  logger?: InputEngineLogger;
}

interface ExtractConfirmParams {
  deps: RenderDeps;
  renderCtx: RenderContext;
  metadata: FieldMetadata;
  inputText: string;
}

/** Check AI availability via conversation.external (D21) */
async function checkAiAvailability(
  conv: ExtractionConversation,
  aiClient: AIExtractionClient,
): Promise<boolean> {
  return conv.external(() => Promise.resolve(aiClient.isAvailable()));
}

/** Wait for user input and extract text from message or caption (D23) */
async function waitForInputText(conv: ExtractionConversation): Promise<string | undefined> {
  const message = await conv.waitFor();
  return message.text ?? message.caption;
}

/** Call AI extraction via conversation.external (D21) */
async function performExtraction(
  params: ExtractionParams,
): AsyncResult<Record<string, unknown>, AppError> {
  const { conv, aiClient, inputText, targetFields, logger } = params;
  try {
    const result = await conv.external(() => aiClient.extract(inputText, targetFields));
    if (result.isErr()) {
      logger?.warn({ msg: 'AI extraction failed', error: result.error });
      return err(result.error);
    }
    return ok(result.value);
  } catch (error: unknown) {
    const appError = new AppError(INPUT_ENGINE_ERRORS.AI_EXTRACTION_FAILED, {
      fieldType: 'AIExtractorField',
      reason: 'AI extraction threw',
      error: String(error),
    });
    logger?.warn({ msg: 'AI extraction threw', error: String(error) });
    return err(appError);
  }
}

/** Build summary lines from extracted values */
function buildSummaryLines(extracted: Record<string, unknown>, t: TranslateFn): string[] {
  return Object.entries(extracted)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${t(`input-engine.fields.${k}`)}: ${String(v)}`);
}

/** Build confirmation inline keyboard */
function buildConfirmationKeyboard(
  formId: string,
  fieldIndex: number,
  t: TranslateFn,
): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        {
          text: t('input-engine.ai.accept'),
          callback_data: encodeFormCallback(formId, fieldIndex, AI_ACTIONS.ACCEPT),
        },
        {
          text: t('input-engine.ai.edit'),
          callback_data: encodeFormCallback(formId, fieldIndex, AI_ACTIONS.EDIT),
        },
      ],
      [
        {
          text: t('input-engine.ai.manual'),
          callback_data: encodeFormCallback(formId, fieldIndex, AI_ACTIONS.MANUAL),
        },
      ],
    ],
  };
}

/** Display extracted values for confirmation with action buttons */
interface ConfirmDisplayParams {
  ctx: ExtractionCtx;
  t: TranslateFn;
  formId: string;
  fieldIndex: number;
  summaryLines: string[];
}

async function displayConfirmation(params: ConfirmDisplayParams): Promise<void> {
  const { ctx, t, formId, fieldIndex, summaryLines } = params;
  const summaryText = [t('input-engine.ai.extracted_summary'), '', ...summaryLines].join('\n');
  const replyMarkup = buildConfirmationKeyboard(formId, fieldIndex, t);
  await ctx.reply(summaryText, { reply_markup: replyMarkup });
}

/** Handle confirmation response and return appropriate result */
function resolveAction(action: string | undefined, extracted: Record<string, unknown>): unknown {
  if (action === AI_ACTIONS.ACCEPT) return extracted;
  if (action === AI_ACTIONS.MANUAL) return undefined;
  return { ...extracted, __partial__: true };
}

/**
 * AIExtractorField handler — full AI extraction flow.
 * Renders prompt → waits for input → extracts via AI → confirmation → accept/edit/manual.
 */
export class AIExtractorFieldHandler implements FieldHandler {
  readonly fieldType = 'AIExtractorField' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    const aiClient = renderCtx.aiClient;
    if (!aiClient) return ok(undefined);

    const deps = this.resolveDeps(renderCtx);
    const isAvailable = await checkAiAvailability(deps.conv, aiClient);
    if (!isAvailable) {
      await deps.ctx.reply(deps.t('input-engine.ai.unavailable'));
      return ok(undefined);
    }

    await deps.ctx.reply(deps.t('input-engine.ai.prompt'));
    const inputText = await waitForInputText(deps.conv);
    if (!inputText) return ok(undefined);

    return this.extractAndConfirm({ deps, renderCtx, metadata, inputText });
  }

  private resolveDeps(renderCtx: RenderContext): RenderDeps {
    return {
      conv: renderCtx.conversation as ExtractionConversation,
      ctx: renderCtx.ctx as ExtractionCtx,
      t: renderCtx.t ?? ((key: string) => key),
    };
  }

  /** Extract via AI then show confirmation flow */
  private async extractAndConfirm(params: ExtractConfirmParams): AsyncResult<unknown, AppError> {
    const { deps, renderCtx, metadata, inputText } = params;
    const targetFields = metadata.targetFields ?? [];
    const extractionResult = await performExtraction({
      conv: deps.conv,
      aiClient: renderCtx.aiClient!,
      inputText,
      targetFields,
      logger: renderCtx.logger,
    });
    if (extractionResult.isErr()) return ok(undefined);
    const extracted = extractionResult.value;

    const summaryLines = buildSummaryLines(extracted, deps.t);
    if (summaryLines.length === 0) return ok(undefined);

    await displayConfirmation({
      ctx: deps.ctx,
      t: deps.t,
      formId: renderCtx.formId,
      fieldIndex: renderCtx.fieldIndex,
      summaryLines,
    });

    const response = await deps.conv.waitForCallbackQuery(/^ie:/);
    const decoded = decodeFormCallback(response.data);
    const action = decoded.isOk() ? decoded.value.value : undefined;
    return ok(resolveAction(action, extracted));
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string; caption?: string };
    const text = msg.text ?? msg.caption;
    if (!text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text or caption in message',
        }),
      );
    }
    return ok(text.trim());
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    if (!value || (typeof value === 'string' && value.length === 0)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value cannot be empty',
        }),
      );
    }
    return ok(value);
  }
}
