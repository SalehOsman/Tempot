import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export interface NotificationDeps {
  eventBus: ModuleEventBus;
}

export function registerNotificationHandlers(_deps: NotificationDeps): void {
  // Event listeners will be connected via event-bus subscription pattern
  // Listens for: VERSION_PUBLISHED, STATUS_CHANGED
  // Queries subscribers and enqueues via @tempot/notifier
}

export const NOTIFICATION_EVENT_SUBSCRIPTIONS = [
  TEMPLATE_EVENTS.VERSION_PUBLISHED,
  TEMPLATE_EVENTS.STATUS_CHANGED,
] as const;
