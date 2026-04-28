import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { NOTIFIER_ERRORS } from './notifier.errors.js';
import type { DeliveryAdapter } from './notifier.ports.js';
import type { DeliveryReceipt, DeliveryRequest } from './notifier.types.js';

export interface TelegramApiLike {
  sendMessage(
    chatId: string,
    text: string,
    options: { disable_notification: boolean },
  ): Promise<{ message_id?: number | string }>;
}

export class TelegramDeliveryAdapter implements DeliveryAdapter {
  constructor(private readonly api: TelegramApiLike) {}

  async deliver(request: DeliveryRequest): AsyncResult<DeliveryReceipt> {
    try {
      const result = await this.api.sendMessage(request.recipient.chatId, request.text, {
        disable_notification: request.silent,
      });
      return ok({ providerMessageId: this.toMessageId(result.message_id) });
    } catch (error) {
      return err(new AppError(this.resolveErrorCode(error), error));
    }
  }

  private toMessageId(messageId: number | string | undefined): string | undefined {
    return messageId === undefined ? undefined : String(messageId);
  }

  private resolveErrorCode(error: unknown): string {
    if (this.isBlockedError(error)) {
      return NOTIFIER_ERRORS.DELIVERY_BLOCKED;
    }
    return NOTIFIER_ERRORS.DELIVERY_FAILED;
  }

  private isBlockedError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message.toLowerCase().includes('bot was blocked');
  }
}
