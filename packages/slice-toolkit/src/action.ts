import {
  type ActorIdentity,
  ForbiddenError,
  type Result,
  ValidationError,
  err,
} from '@tembot/shared-types';
import type { ZodSchema, z } from 'zod';

export interface ActionContext {
  readonly actor?: ActorIdentity;
  readonly correlationId?: string;
  readonly tenantId?: string;
}

export interface ActionDefinition<TSchema extends ZodSchema, TOutput, TError> {
  readonly inputSchema: TSchema;
  readonly requiredCapabilities?: readonly string[];
  handler(input: z.infer<TSchema>, ctx: ActionContext): Promise<Result<TOutput, TError>>;
}

export type ActionHandler<TSchema extends ZodSchema, TOutput, TError> = (
  rawInput: z.input<TSchema> | unknown,
  ctx?: ActionContext,
) => Promise<Result<TOutput, TError | ValidationError | ForbiddenError>>;

/**
 * Universal Action Builder enforcing the 10 Taboos:
 * 1. Validates raw input through Zod schema (Fail-Fast).
 * 2. Evaluates actor capabilities (Zero-Role Capability Engine).
 * 3. Enforces typed Result return (never throws uncontrolled exceptions).
 */
export function defineAction<TSchema extends ZodSchema, TOutput, TError>(
  definition: ActionDefinition<TSchema, TOutput, TError>,
): ActionHandler<TSchema, TOutput, TError> {
  return async (rawInput: unknown, ctx: ActionContext = {}) => {
    // 1. Zod input contract validation
    const parsed = definition.inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        name: issue.path.join('.'),
        reason: issue.message,
      }));
      return err(new ValidationError('Invalid input payload contract', details));
    }

    // 2. Capability evaluation
    if (definition.requiredCapabilities && definition.requiredCapabilities.length > 0) {
      const actorCaps = new Set(ctx.actor?.capabilities ?? []);
      const isSuperAdmin = actorCaps.has('*');

      if (!isSuperAdmin) {
        for (const reqCap of definition.requiredCapabilities) {
          if (!actorCaps.has(reqCap)) {
            return err(new ForbiddenError(`Actor lacks required capability: '${reqCap}'`));
          }
        }
      }
    }

    // 3. Delegate to pure functional use-case handler
    try {
      return await definition.handler(parsed.data, ctx);
    } catch (unexpectedError) {
      // Invariant: Uncontrolled runtime crash safety
      const message =
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'Unexpected execution exception';
      return err(new ValidationError(`Internal action failure: ${message}`) as unknown as TError);
    }
  };
}
