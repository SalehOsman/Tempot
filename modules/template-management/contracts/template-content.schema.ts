import { z } from 'zod';

export const templateCommandDefSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().min(1).max(255),
  handler: z.string().max(255).optional(),
});

export const templateMessageDefSchema = z.object({
  key: z.string().min(1).max(255),
  defaultText: z
    .record(z.string(), z.string().min(1))
    .refine((texts: Record<string, string>) => Object.keys(texts).length > 0, {
      message: 'At least one language entry is required',
    }),
  placeholders: z.array(z.string()).optional(),
});

export const templateFormStepSchema = z.object({
  field: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'date', 'select', 'boolean']),
  label: z.string().min(1).max(255),
  validation: z.string().max(500).optional(),
  options: z.array(z.string()).optional(),
});

export const templateInputFormDefSchema = z.object({
  name: z.string().min(1).max(100),
  steps: z.array(templateFormStepSchema).min(1),
});

export const templatePermissionDefSchema = z.object({
  action: z.string().min(1).max(100),
  subject: z.string().min(1).max(100),
  minRole: z.string().min(1).max(50),
});

export const templateSettingDefSchema = z.object({
  key: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'boolean']),
  defaultValue: z.unknown(),
  description: z.string().min(1).max(500),
});

export const templateContentSchema = z.object({
  commands: z.array(templateCommandDefSchema).min(1, {
    message: 'At least one command definition is required',
  }),
  messages: z.array(templateMessageDefSchema).min(1, {
    message: 'At least one message definition is required',
  }),
  inputForms: z.array(templateInputFormDefSchema).optional(),
  permissions: z.array(templatePermissionDefSchema).optional(),
  settings: z.array(templateSettingDefSchema).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  categoryId: z.string().min(1).optional(),
  language: z.enum(['ar', 'en']),
  tags: z.array(z.string().min(1).max(100)).max(20).optional(),
});

export type CreateTemplateSchemaInput = z.infer<typeof createTemplateSchema>;
export type TemplateContentSchemaInput = z.infer<typeof templateContentSchema>;
