import { z } from 'zod';
import type { FieldMetadata } from '@tempot/input-engine';

export function createBotRegistrationSchema(): z.ZodObject<z.ZodRawShape> {
  return z.object({
    displayName: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.display_name',
      minLength: 1,
      maxLength: 120,
    }),
    telegramUsername: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.telegram_username',
      minLength: 1,
      maxLength: 64,
    }),
    token: registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'bot-management.create.prompt.token',
      minLength: 10,
      maxLength: 256,
    }),
  });
}

function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}
