import { z } from 'zod';

const userRoleSchema = z.enum(['GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN']);

const aiDegradationModeSchema = z.enum(['graceful', 'queue', 'disable']);

const moduleCommandSchema = z.object({
  command: z.string().min(1),
  description: z.string().min(1),
});

const moduleFeaturesSchema = z.object({
  hasDatabase: z.boolean(),
  hasNotifications: z.boolean(),
  hasAttachments: z.boolean(),
  hasExport: z.boolean(),
  hasAI: z.boolean(),
  hasInputEngine: z.boolean(),
  hasImport: z.boolean(),
  hasSearch: z.boolean(),
  hasDynamicCMS: z.boolean(),
  hasRegional: z.boolean(),
});

const moduleRequirementsSchema = z.object({
  packages: z.array(z.string()),
  optional: z.array(z.string()),
});

const navigationItemSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  callbackData: z.string().min(1),
  requiredRole: userRoleSchema,
  row: z.number().int().min(0),
  order: z.number().int().min(0),
});

const moduleNavigationSchema = z.object({
  mainMenu: z.array(navigationItemSchema),
});

export const moduleConfigSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    requiredRole: userRoleSchema,
    commands: z.array(moduleCommandSchema),
    features: moduleFeaturesSchema,
    isActive: z.boolean(),
    isCore: z.boolean(),
    aiDegradationMode: aiDegradationModeSchema.optional(),
    requires: moduleRequirementsSchema,
    scopedUsers: z.array(z.number()).optional(),
    navigation: moduleNavigationSchema.optional(),
  })
  .refine((data) => !data.features.hasAI || data.aiDegradationMode !== undefined, {
    message: 'aiDegradationMode is required when hasAI is true',
  });
