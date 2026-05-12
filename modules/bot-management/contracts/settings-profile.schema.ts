import { z } from 'zod';

export const botSettingsProfileSchema = z.object({
  locale: z.string().min(2).max(10),
  country: z.string().min(2).max(10),
  timezone: z.string().min(1).max(100),
  notificationsEnabled: z.boolean(),
  privacyMode: z.enum(['standard', 'strict']),
  featureToggles: z.record(z.string(), z.boolean()),
});

export type BotSettingsProfileSchemaInput = z.infer<typeof botSettingsProfileSchema>;
