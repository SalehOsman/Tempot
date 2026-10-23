import { z } from 'zod';

export const UpdateSystemSettingsSchema = z.object({
  botName: z.string().min(1).max(64).optional(),
  welcomeMessage: z.string().max(2048).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(512).optional(),
  defaultLocale: z.enum(['ar', 'en']).optional(),
  brandingPrimaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').optional(),
});
export type UpdateSystemSettingsDto = z.infer<typeof UpdateSystemSettingsSchema>;

export const SystemSettingsResponseSchema = z.object({
  id: z.string(),
  botName: z.string(),
  welcomeMessage: z.string(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().nullable(),
  defaultLocale: z.enum(['ar', 'en']),
  brandingPrimaryColor: z.string(),
  updatedAt: z.string(),
});
export type SystemSettingsResponseDto = z.infer<typeof SystemSettingsResponseSchema>;
