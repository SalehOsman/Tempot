import type { Context } from 'grammy';

/**
 * Minimal interface compatible with any Zod schema's safeParse method.
 * Bot-server does not depend on zod directly; modules bring their own schemas.
 */
export interface SafeParseSchema<T = unknown> {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { errors: Array<{ message: string }> } };
}

export interface CommandValidator<T = unknown> {
  schema: SafeParseSchema<T>;
  /** Extract raw input to validate — defaults to the text after the command name. */
  extract?: (ctx: Context) => unknown;
}

const registry = new Map<string, CommandValidator>();

/**
 * Register a schema for a bot command.
 * Call from module setup before the bot starts polling.
 *
 * @example
 * registerCommandSchema('start', { schema: z.object({ ref: z.string().optional() }) });
 */
export function registerCommandSchema<T>(command: string, validator: CommandValidator<T>): void {
  registry.set(command.replace(/^\//, ''), validator);
}

/**
 * Validate the current context against a registered command schema.
 * Returns a typed parse result or null when no schema is registered for this command.
 */
export function validateCommand<T = unknown>(
  command: string,
  ctx: Context,
): { success: true; data: T } | { success: false; error: string } | null {
  const entry = registry.get(command.replace(/^\//, '')) as CommandValidator<T> | undefined;
  if (!entry) return null;

  const raw = entry.extract ? entry.extract(ctx) : ((ctx.match as string | undefined) ?? '');
  const result = entry.schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const first = result.error.errors[0];
  return { success: false, error: first?.message ?? 'invalid_input' };
}

/** Exposed for testing only — clears all registered schemas. */
export function clearCommandSchemas(): void {
  registry.clear();
}
