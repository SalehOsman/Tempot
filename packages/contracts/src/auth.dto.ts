import { z } from 'zod';

export const TelegramInitDataAuthSchema = z.object({
  initData: z.string().min(1, 'Telegram initData string is required'),
});
export type TelegramInitDataAuthDto = z.infer<typeof TelegramInitDataAuthSchema>;

export const OperatorLoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type OperatorLoginDto = z.infer<typeof OperatorLoginSchema>;

export const AuthSessionResponseSchema = z.object({
  token: z.string(),
  actor: z.object({
    id: z.string(),
    type: z.enum(['telegram_user', 'operator', 'system_worker']),
    capabilities: z.array(z.string()),
    tenantId: z.string().optional(),
  }),
  expiresAt: z.string(),
});
export type AuthSessionResponseDto = z.infer<typeof AuthSessionResponseSchema>;
