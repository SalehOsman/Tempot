import { z } from 'zod';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { StaticSettings } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

const botAccessModeSchema = z.enum(['private', 'public']).default('private');

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
  BOT_ACCESS_MODE: botAccessModeSchema,
  PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION: z.string().optional(),
  PROTECTED_DATA_ENCRYPTION_KEYS: z.string().optional(),
  PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION: z.string().optional(),
  PROTECTED_DATA_LOOKUP_KEYS: z.string().optional(),
});

function parseKeyMap(value: string): Readonly<Record<string, Buffer>> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const entries = Object.entries(parsed);
    if (entries.length === 0) return null;

    const keys: Record<string, Buffer> = {};
    for (const [version, encodedKey] of entries) {
      if (version.trim().length === 0 || typeof encodedKey !== 'string') return null;
      const key = Buffer.from(encodedKey, 'base64');
      if (key.length !== 32 || key.toString('base64') !== encodedKey) return null;
      keys[version] = key;
    }
    return keys;
  } catch {
    return null;
  }
}

function loadProtectedDataKeys(
  data: z.infer<typeof staticSettingsSchema>,
): Result<StaticSettings['protectedDataKeys'], AppError> {
  const values = [
    data.PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION,
    data.PROTECTED_DATA_ENCRYPTION_KEYS,
    data.PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION,
    data.PROTECTED_DATA_LOOKUP_KEYS,
  ];
  if (values.every((value) => value === undefined)) return ok(null);
  if (values.some((value) => value === undefined)) {
    return err(new AppError(SETTINGS_ERRORS.PROTECTED_DATA_INVALID_KEY_RING));
  }

  const activeEncryptionKeyVersion = data.PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION;
  const activeLookupKeyVersion = data.PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION;
  if (
    !activeEncryptionKeyVersion ||
    !activeLookupKeyVersion ||
    !data.PROTECTED_DATA_ENCRYPTION_KEYS ||
    !data.PROTECTED_DATA_LOOKUP_KEYS
  ) {
    return err(new AppError(SETTINGS_ERRORS.PROTECTED_DATA_INVALID_KEY_RING));
  }

  const encryptionKeys = parseKeyMap(data.PROTECTED_DATA_ENCRYPTION_KEYS);
  const lookupKeys = parseKeyMap(data.PROTECTED_DATA_LOOKUP_KEYS);
  if (
    !encryptionKeys ||
    !lookupKeys ||
    !encryptionKeys[activeEncryptionKeyVersion] ||
    !lookupKeys[activeLookupKeyVersion]
  ) {
    return err(new AppError(SETTINGS_ERRORS.PROTECTED_DATA_INVALID_KEY_RING));
  }

  const encryptionMaterial = new Set(
    Object.values(encryptionKeys).map((key) => key.toString('base64')),
  );
  const hasReusedMaterial = Object.values(lookupKeys).some((key) =>
    encryptionMaterial.has(key.toString('base64')),
  );
  if (hasReusedMaterial) {
    return err(new AppError(SETTINGS_ERRORS.PROTECTED_DATA_KEY_REUSE));
  }

  return ok({
    activeEncryptionKeyVersion,
    encryptionKeys,
    activeLookupKeyVersion,
    lookupKeys,
  });
}

export class StaticSettingsLoader {
  static load(
    env: Record<string, string | undefined> = process.env,
  ): Result<StaticSettings, AppError> {
    const parsed = staticSettingsSchema.safeParse(env);
    if (!parsed.success) {
      return err(new AppError(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED, parsed.error.issues));
    }
    const protectedDataKeys = loadProtectedDataKeys(parsed.data);
    if (protectedDataKeys.isErr()) return err(protectedDataKeys.error);

    return ok({
      botToken: parsed.data.BOT_TOKEN,
      databaseUrl: parsed.data.DATABASE_URL,
      superAdminIds: parsed.data.SUPER_ADMIN_IDS,
      defaultLanguage: parsed.data.DEFAULT_LANGUAGE,
      defaultCountry: parsed.data.DEFAULT_COUNTRY,
      botAccessMode: parsed.data.BOT_ACCESS_MODE,
      protectedDataKeys: protectedDataKeys.value,
    });
  }
}
