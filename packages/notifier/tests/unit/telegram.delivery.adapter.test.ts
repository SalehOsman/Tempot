import { describe, expect, it, vi } from 'vitest';
import { TelegramDeliveryAdapter } from '../../src/telegram.delivery.adapter.js';

describe('TelegramDeliveryAdapter', () => {
  it('should map delivery requests to Telegram sendMessage options', async () => {
    const api = {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 42 }),
    };
    const adapter = new TelegramDeliveryAdapter(api);

    const result = await adapter.deliver({
      recipient: { userId: 'user-1', chatId: '100', locale: 'ar' },
      text: 'Rendered message',
      silent: true,
      metadata: { source: 'unit' },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().providerMessageId).toBe('42');
    expect(api.sendMessage).toHaveBeenCalledWith('100', 'Rendered message', {
      disable_notification: true,
    });
  });
});
