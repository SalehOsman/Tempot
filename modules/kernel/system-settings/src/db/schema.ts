import {
  auditTimestamps,
  multiTenancyColumns,
  softDeleteColumns,
} from '@tembot/db-kernel';
import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

/**
 * Sovereign System Settings & Tri-Surface Configuration Schema.
 * Adheres strictly to the 10 Engineering Taboos:
 * - Multi-tenancy isolation (tenant_id)
 * - Zero Hard Deletes (deleted_at)
 * - Timezone-aware audit timestamps (created_at, updated_at)
 */
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  ...multiTenancyColumns,

  // 1. General & Global Platform Governance
  platformName: text('platform_name').default('Tembot Platform').notNull(),
  defaultLocale: text('default_locale').$type<'ar' | 'en'>().default('ar').notNull(),
  isGlobalMaintenance: boolean('is_global_maintenance').default(false).notNull(),
  globalMaintenanceMessage: text('global_maintenance_message'),

  // 2. Telegram Bot Surface Configuration
  botName: text('bot_name').default('Tembot').notNull(),
  botWelcomeMessage: text('bot_welcome_message').default('مرحباً بك في المنصة!').notNull(),
  botHelpMessage: text('bot_help_message').default('قائمة الأوامر المتاحة:...').notNull(),
  botMaintenanceMode: boolean('bot_maintenance_mode').default(false).notNull(),

  // 3. Telegram Mini App (TMA) Surface Configuration
  tmaTitle: text('tma_title').default('Tembot Mini App').notNull(),
  tmaPrimaryColor: text('tma_primary_color').default('#2563eb').notNull(),
  tmaMaintenanceMode: boolean('tma_maintenance_mode').default(false).notNull(),

  // 4. Web Admin Dashboard Surface Configuration
  dashboardLogoUrl: text('dashboard_logo_url'),
  sessionTimeoutMinutes: integer('session_timeout_minutes').default(60).notNull(),

  ...auditTimestamps,
  ...softDeleteColumns,
});

export type SystemSettingsRecord = typeof systemSettings.$inferSelect;
export type NewSystemSettingsRecord = typeof systemSettings.$inferInsert;
