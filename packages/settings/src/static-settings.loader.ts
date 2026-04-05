import { z } from 'zod';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { StaticSettings } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

const superAdminIdsSchema = z
  .string()
  .transform((val) => {
    if (!val || val.trim() === '') return [];
    return val.split(',').map((s) => s.trim());
  })
  .refine(
    (parts) => parts.every((part) => !isNaN(Number(part)) && Number(part) > 0),
    'SUPER_ADMIN_IDS must contain only positive integers',
  )
  .transform((parts) => parts.map(Number));

const staticSettingsSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPER_ADMIN_IDS: superAdminIdsSchema,
  DEFAULT_LANGUAGE: z.string().min(1, 'DEFAULT_LANGUAGE is required'),
  DEFAULT_COUNTRY: z.string().min(1, 'DEFAULT_COUNTRY is required'),
});

export class StaticSettingsLoader {
  static load(
    env: Record<string, string | undefined> = process.env,
  ): Result<StaticSettings, AppError> {
    const parsed = staticSettingsSchema.safeParse(env);
    if (!parsed.success) {
      return err(new AppError(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED, parsed.error.issues));
    }
    return ok({
      botToken: parsed.data.BOT_TOKEN,
      databaseUrl: parsed.data.DATABASE_URL,
      superAdminIds: parsed.data.SUPER_ADMIN_IDS,
      defaultLanguage: parsed.data.DEFAULT_LANGUAGE,
      defaultCountry: parsed.data.DEFAULT_COUNTRY,
    });
  }
}
