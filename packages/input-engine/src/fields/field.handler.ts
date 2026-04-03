import type { Result, AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { FieldType, FieldMetadata } from '../input-engine.types.js';

/** Interface that every field type handler implements */
export interface FieldHandler {
  readonly fieldType: FieldType;

  /** Render the field prompt and UI elements */
  render(
    conversation: unknown, // grammY Conversation
    ctx: unknown, // grammY Context
    metadata: FieldMetadata,
    formData: Record<string, unknown>,
  ): AsyncResult<void, AppError>;

  /** Parse the user's raw response into a typed value */
  parseResponse(
    message: unknown, // grammY Message
    metadata: FieldMetadata,
  ): Result<unknown, AppError>;

  /** Validate the parsed value against the Zod schema */
  validate(
    value: unknown,
    schema: unknown, // ZodType
    metadata: FieldMetadata,
  ): Result<unknown, AppError>;
}

/** Registry of all field handlers, keyed by FieldType */
export class FieldHandlerRegistry {
  private readonly handlers = new Map<FieldType, FieldHandler>();

  /** Register a field handler */
  register(handler: FieldHandler): void {
    this.handlers.set(handler.fieldType, handler);
  }

  /** Get handler for a field type */
  get(fieldType: FieldType): FieldHandler | undefined {
    return this.handlers.get(fieldType);
  }

  /** Check if a handler exists for a field type */
  has(fieldType: FieldType): boolean {
    return this.handlers.has(fieldType);
  }

  /** Get all registered field types */
  getRegisteredTypes(): FieldType[] {
    return Array.from(this.handlers.keys());
  }
}
