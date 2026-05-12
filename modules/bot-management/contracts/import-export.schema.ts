import { z } from 'zod';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';
import { exportedBotProfileSchema } from './bot-profile.schema.js';

export const botProfileImportSchema = z
  .object({
    sourceProfile: exportedBotProfileSchema,
    targetStatus: z.literal(BotLifecycleStatus.DRAFT),
  })
  .strict();

export const botProfileExportRequestSchema = z
  .object({
    botId: z.string().min(1),
    format: z.enum(['JSON', 'DOCUMENT']),
    requestedBy: z.string().min(1),
  })
  .strict();

export type BotProfileImportSchemaInput = z.infer<typeof botProfileImportSchema>;
export type BotProfileExportRequestSchemaInput = z.infer<typeof botProfileExportRequestSchema>;
