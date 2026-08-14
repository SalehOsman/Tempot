import { z } from 'zod';
import { BotModuleEnablementState } from '../types/module-enablement.types.js';

export const moduleEnablementSchema = z
  .object({
    moduleName: z.string().min(1).max(120),
    state: z.nativeEnum(BotModuleEnablementState),
    blockedReason: z.string().min(1).max(255).optional(),
    enabledBy: z.string().min(1).optional(),
    enabledAt: z.string().datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.state === BotModuleEnablementState.BLOCKED && !value.blockedReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blockedReason'],
        message: 'blockedReason is required when state is BLOCKED',
      });
    }

    if (
      value.state === BotModuleEnablementState.ENABLED &&
      (!value.enabledBy || !value.enabledAt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['enabledBy'],
        message: 'enabledBy and enabledAt are required when state is ENABLED',
      });
    }
  });

export type ModuleEnablementSchemaInput = z.infer<typeof moduleEnablementSchema>;
