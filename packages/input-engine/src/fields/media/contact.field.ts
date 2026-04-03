import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import type { ContactResult } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Telegram Contact shape */
interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

export class ContactFieldHandler implements FieldHandler {
  readonly fieldType = 'Contact' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { contact?: TelegramContact };
    if (!msg.contact) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No contact in message',
        }),
      );
    }
    const c = msg.contact;
    const result: ContactResult = {
      phoneNumber: c.phone_number,
      firstName: c.first_name,
    };
    if (c.last_name !== undefined) result.lastName = c.last_name;
    if (c.user_id !== undefined) result.userId = c.user_id;
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const contact = value as ContactResult;
    if (!contact.phoneNumber || !contact.firstName) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.CONTACT_NOT_SHARED, {
          fieldType: this.fieldType,
          reason: 'Contact data incomplete',
        }),
      );
    }
    return ok(contact);
  }
}
