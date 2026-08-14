export const BOT_MANAGEMENT_EVENTS = {
  BOT_REGISTERED: 'bot-management.bot.registered',
  BOT_UPDATED: 'bot-management.bot.updated',
  LIFECYCLE_CHANGED: 'bot-management.lifecycle.changed',
  SETTINGS_CHANGED: 'bot-management.settings.changed',
  MODULE_ENABLEMENT_CHANGED: 'bot-management.module-enablement.changed',
  PROVISIONING_COMPLETED: 'bot-management.provisioning.completed',
  HEALTH_CHANGED: 'bot-management.health.changed',
  EXPORT_COMPLETED: 'bot-management.export.completed',
  IMPORT_COMPLETED: 'bot-management.import.completed',
} as const;

export type BotManagementEventName =
  (typeof BOT_MANAGEMENT_EVENTS)[keyof typeof BOT_MANAGEMENT_EVENTS];
