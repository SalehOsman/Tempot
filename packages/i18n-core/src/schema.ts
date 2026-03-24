import { z, type ZodType } from 'zod';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Recursive type representing a locale file structure.
 * Leaf values must be strings; intermediate nodes are nested objects.
 */
type LocaleValue = string | { [key: string]: LocaleValue };

/**
 * Zod schema that validates locale JSON files.
 * Accepts flat key-value (`{ "key": "value" }`) or nested
 * (`{ "namespace": { "key": "value" } }`) structures.
 * All leaf values must be strings. The object must have at least one key.
 */
const localeValueSchema: ZodType<LocaleValue> = z.lazy(() =>
  z.union([z.string(), z.record(z.string(), localeValueSchema)]),
);

export const LocaleSchema = z
  .record(z.string(), localeValueSchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Locale file must contain at least one key',
  });

/** Inferred TypeScript type from `LocaleSchema`. */
export type LocaleFile = z.infer<typeof LocaleSchema>;

/**
 * Validates raw data against the `LocaleSchema`.
 * Returns `Result<LocaleFile, AppError>` per the project Result pattern.
 */
export function validateLocaleFile(data: unknown): Result<LocaleFile, AppError> {
  const parsed = LocaleSchema.safeParse(data);
  if (parsed.success) {
    return ok(parsed.data);
  }
  return err(
    new AppError(
      'I18N_SCHEMA_VALIDATION_FAILED',
      `Locale file validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    ),
  );
}

/**
 * Generates a strict Zod schema from a source locale (e.g. `ar.json`).
 * The returned schema enforces that the target locale has exactly the
 * same key structure — no missing keys, no extra keys.
 */
export function generateSchemaFromSource(source: Record<string, unknown>): ZodType {
  const shape: Record<string, ZodType> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      shape[key] = z.string();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      shape[key] = generateSchemaFromSource(value as Record<string, unknown>);
    }
  }

  return z.object(shape).strict();
}
