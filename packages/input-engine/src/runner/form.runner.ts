import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { SchemaValidator } from './schema.validator.js';
import { shouldRenderField } from './condition.evaluator.js';
import { emitEvent } from './event.emitter.js';
import type { InputEngineLogger, InputEngineEventBus } from '../input-engine.contracts.js';
import type { FieldMetadata, FormOptions } from '../input-engine.types.js';
import { DEFAULT_FORM_OPTIONS } from '../input-engine.types.js';
import type { FieldHandlerRegistry, FieldHandler } from '../fields/field.handler.js';

/** Dependencies injected into the FormRunner */
export interface FormRunnerDeps {
  registry: FieldHandlerRegistry;
  logger: InputEngineLogger;
  eventBus: InputEngineEventBus;
  isEnabled: () => boolean;
  getActiveConversation: () => string | undefined;
  setActiveConversation: (formId: string | undefined) => void;
  userId: string;
  chatId: number;
}

/** Bundled input for runForm: conversation context + schema */
export interface FormRunnerInput {
  conversation: unknown;
  ctx: unknown;
  schema: z.ZodObject<z.ZodRawShape>;
  options?: FormOptions;
}

/** Default max retries per field */
const DEFAULT_MAX_RETRIES = 3;

/** Bundled event deps to stay under max-params */
interface EventDeps {
  eventBus: InputEngineEventBus;
  logger: InputEngineLogger;
}

/** Mutable progress tracker shared between functions */
interface FormProgress {
  fieldsCompleted: number;
  totalFields: number;
  formId: string;
  formData: Record<string, unknown>;
}

/** Extract field metadata from zod global registry */
function getFieldMetadata(schema: z.ZodType): FieldMetadata {
  const meta = z.globalRegistry.get(schema);
  return (meta as Record<string, unknown> | undefined)?.['input-engine'] as FieldMetadata;
}

/** Run precondition checks: toggle, schema, active conversation */
function checkPreconditions(
  schema: z.ZodObject<z.ZodRawShape>,
  deps: FormRunnerDeps,
): AppError | undefined {
  if (!deps.isEnabled()) {
    return new AppError(INPUT_ENGINE_ERRORS.DISABLED);
  }
  const result = new SchemaValidator(deps.registry).validate(schema);
  if (result.isErr()) return result.error;

  const active = deps.getActiveConversation();
  if (active !== undefined) {
    return new AppError(INPUT_ENGINE_ERRORS.FORM_ALREADY_ACTIVE, {
      existingFormId: active,
    });
  }
  return undefined;
}

/** Internal context for processing a single field */
interface FieldContext {
  handler: FieldHandler;
  metadata: FieldMetadata;
  fieldSchema: z.ZodType;
  fieldName: string;
  maxRetries: number;
  formData: Record<string, unknown>;
  retryCount: number;
}

/** Process a single field: render, parse, validate with retry */
async function processField(
  input: FormRunnerInput,
  ctx: FieldContext,
): AsyncResult<unknown, AppError> {
  const { handler, metadata, fieldSchema, maxRetries } = ctx;
  let retryCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rr = await handler.render(input.conversation, input.ctx, metadata, ctx.formData);
    if (rr.isErr()) return err(rr.error);

    const pr = handler.parseResponse(input.ctx, metadata);
    if (pr.isErr()) {
      retryCount++;
      continue;
    }

    const vr = handler.validate(pr.value, fieldSchema, metadata);
    if (vr.isErr()) {
      retryCount++;
      continue;
    }

    ctx.retryCount = retryCount;
    return ok(vr.value);
  }

  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES, {
      fieldName: ctx.fieldName,
      fieldType: metadata.fieldType,
      maxRetries,
    }),
  );
}

/** Iterate all schema fields, processing each one */
async function iterateFields(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  const evDeps: EventDeps = {
    eventBus: deps.eventBus,
    logger: deps.logger,
  };
  progress.totalFields = fieldNames.length;

  for (const fieldName of fieldNames) {
    const fieldSchema = input.schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      deps.logger.debug({
        msg: 'Skipping conditional field',
        formId: progress.formId,
        fieldName,
      });
      continue;
    }

    const handler = deps.registry.get(metadata.fieldType);
    if (!handler) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN, {
          fieldName,
          fieldType: metadata.fieldType,
        }),
      );
    }

    const ctx: FieldContext = {
      handler,
      metadata,
      fieldSchema,
      fieldName,
      maxRetries: metadata.maxRetries ?? DEFAULT_MAX_RETRIES,
      formData: progress.formData,
      retryCount: 0,
    };

    const result = await processField(input, ctx);
    if (result.isErr()) return err(result.error);

    progress.formData[fieldName] = result.value;
    progress.fieldsCompleted++;

    await emitEvent(evDeps, 'input-engine.field.validated', {
      formId: progress.formId,
      userId: deps.userId,
      fieldType: metadata.fieldType,
      fieldName,
      valid: true,
      retryCount: ctx.retryCount,
    });
  }

  return ok(undefined);
}

/**
 * Run a form by iterating fields in a Zod schema, calling handlers
 * for each field, and collecting validated values.
 */
export async function runForm<T>(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  options?: FormOptions,
): AsyncResult<T, AppError> {
  const preErr = checkPreconditions(input.schema, deps);
  if (preErr) return err(preErr);

  const merged: Required<FormOptions> = {
    ...DEFAULT_FORM_OPTIONS,
    ...options,
    ...input.options,
  };
  const formId = merged.formId || crypto.randomUUID().slice(0, 8);
  deps.setActiveConversation(formId);

  const evDeps: EventDeps = {
    eventBus: deps.eventBus,
    logger: deps.logger,
  };
  const progress: FormProgress = {
    fieldsCompleted: 0,
    totalFields: 0,
    formId,
    formData: {},
  };
  const startTime = Date.now();

  await emitEvent(evDeps, 'input-engine.form.started', {
    formId,
    userId: deps.userId,
    chatId: deps.chatId,
    fieldCount: Object.keys(input.schema.shape).length,
    timestamp: new Date(),
  });

  const loopResult = await iterateFields(input, deps, progress);

  if (loopResult.isErr()) {
    deps.setActiveConversation(undefined);
    if (loopResult.error.code === INPUT_ENGINE_ERRORS.FORM_CANCELLED) {
      await emitEvent(evDeps, 'input-engine.form.cancelled', {
        formId,
        userId: deps.userId,
        fieldsCompleted: progress.fieldsCompleted,
        totalFields: progress.totalFields,
        reason: 'user_cancel',
      });
    }
    return err(loopResult.error);
  }

  deps.setActiveConversation(undefined);
  await emitEvent(evDeps, 'input-engine.form.completed', {
    formId,
    userId: deps.userId,
    fieldCount: progress.fieldsCompleted,
    durationMs: Date.now() - startTime,
    hadPartialSave: merged.partialSave,
  });

  return ok(progress.formData as T);
}
