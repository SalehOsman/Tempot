import { describe, expect, it, vi } from 'vitest';
import { TEMPLATE_EVENTS } from '../../events/event-names.js';
import {
  NOTIFICATION_EVENT_SUBSCRIPTIONS,
  registerNotificationHandlers,
} from '../../handlers/notification.handler.js';

describe('template notification handler registration', () => {
  it('declares the template events consumed by notification fan-out', () => {
    expect(NOTIFICATION_EVENT_SUBSCRIPTIONS).toEqual([
      TEMPLATE_EVENTS.VERSION_PUBLISHED,
      TEMPLATE_EVENTS.STATUS_CHANGED,
    ]);
  });

  it('accepts event-bus dependencies without subscribing imperatively yet', () => {
    const eventBus = { publish: vi.fn().mockResolvedValue({ isOk: () => true }) };

    registerNotificationHandlers({ eventBus });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
