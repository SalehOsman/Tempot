import { z } from 'zod';
import { BotRuntimeMode } from '../types/bot.types.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';
import { botSettingsProfileSchema } from './settings-profile.schema.js';
import { moduleEnablementSchema } from './module-enablement.schema.js';

export const botProfileSchema = z
  .object({
    displayName: z.string().min(1).max(120),
    telegramUsername: z
      .string()
      .min(5)
      .max(64)
      .regex(/^[a-zA-Z0-9_]+$/),
    tokenFingerprint: z.string().min(1).max(255),
    tokenRedacted: z.string().min(1).max(255),
    ownerId: z.string().min(1),
    runtimeMode: z.nativeEnum(BotRuntimeMode),
    status: z.nativeEnum(BotLifecycleStatus),
    defaultLocale: z.string().min(2).max(10),
    defaultCountry: z.string().min(2).max(10),
    timezone: z.string().min(1).max(100),
  })
  .strict();

export const exportedBotProfileBotSchema = botProfileSchema.strict();

export const exportedBotProfileSchema = z
  .object({
    schema: z.literal('tempot-bot-profile/1.0'),
    exportedAt: z.string().datetime(),
    bot: exportedBotProfileBotSchema,
    settings: botSettingsProfileSchema,
    modules: z.array(moduleEnablementSchema),
    credentialSetupRequired: z.boolean(),
  })
  .strict();

export type BotProfileSchemaInput = z.infer<typeof botProfileSchema>;
export type ExportedBotProfileSchemaInput = z.infer<typeof exportedBotProfileSchema>;
