import {
  type InlineButton,
  type RenderedRichMessage,
  buildRichConfirmation,
  buildRichPage,
} from '@tembot/core-components';
import type { SystemSettingsRecord } from '../db/schema.js';

export const SETTINGS_CALLBACKS = {
  MAIN: 'cfg:main',
  LOCALE_MENU: 'cfg:loc',
  SET_LOCALE_AR: 'cfg:loc:ar',
  SET_LOCALE_EN: 'cfg:loc:en',
  MAINT_MENU: 'cfg:mnt',
  TOGGLE_MAINT_BOT: 'cfg:mnt:bot',
  TOGGLE_MAINT_TMA: 'cfg:mnt:tma',
  TOGGLE_MAINT_GLOBAL: 'cfg:mnt:all',
  CONFIRM_PREFIX: 'cfg:cfm:',
  CANCEL: 'cfg:cancel',
  CLOSE: 'cfg:close',
} as const;

/**
 * Builds the persistent bottom reply keyboard including the Settings button.
 */
export function buildPersistentReplyKeyboard(options: { tmaUrl?: string; isRtl?: boolean } = {}) {
  const isRtl = options.isRtl ?? true;
  const tmaLabel = isRtl ? '🚀 فتح التطبيق' : '🚀 Open App';
  const settingsLabel = isRtl ? '⚙️ الإعدادات' : '⚙️ Settings';

  // Telegram Invariant: web_app buttons strictly require HTTPS links
  const hasHttpsTma = Boolean(options.tmaUrl?.startsWith('https://'));

  return {
    keyboard: [
      [
        hasHttpsTma && options.tmaUrl
          ? { text: tmaLabel, web_app: { url: options.tmaUrl } }
          : { text: tmaLabel },
        { text: settingsLabel },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * Renders the main Rich Message Settings dashboard.
 */
export function renderMainSettingsPage(
  settings: SystemSettingsRecord,
  isRtl = true,
): RenderedRichMessage {
  const title = isRtl ? 'إعدادات النظام والأسطح الثلاثية' : 'System & Tri-Surface Settings';
  const localeText = settings.defaultLocale === 'ar' ? 'العربية (Arabic)' : 'الإنجليزية (English)';
  const botStatus = settings.botMaintenanceMode ? '🛑 وضع الصيانة' : '🟢 يعمل بنشاط';
  const tmaStatus = settings.tmaMaintenanceMode ? '🛑 وضع الصيانة' : '🟢 متاح للمستخدمين';
  const globalStatus = settings.isGlobalMaintenance ? '🛑 صيانة شاملة' : '🟢 تشغيل طبيعي';

  const bodyBlocks = isRtl
    ? [
        `🏢 <b>اسم المنصة:</b> ${settings.platformName}`,
        `🌐 <b>اللغة الافتراضية:</b> ${localeText}`,
        `🤖 <b>سطح البوت:</b> ${botStatus}`,
        `📱 <b>سطح الميني اب:</b> ${tmaStatus}`,
        `🛡️ <b>الحالة العامة:</b> ${globalStatus}`,
        `🎨 <b>لون الهوية (TMA):</b> <code>${settings.tmaPrimaryColor}</code>`,
      ]
    : [
        `🏢 <b>Platform:</b> ${settings.platformName}`,
        `🌐 <b>Default Locale:</b> ${localeText}`,
        `🤖 <b>Bot Surface:</b> ${botStatus}`,
        `📱 <b>TMA Surface:</b> ${tmaStatus}`,
        `🛡️ <b>Global Status:</b> ${globalStatus}`,
        `🎨 <b>Brand Color:</b> <code>${settings.tmaPrimaryColor}</code>`,
      ];

  const buttons: readonly (readonly InlineButton[])[] = isRtl
    ? [
        [
          { text: '🌐 تغيير اللغة', callbackData: SETTINGS_CALLBACKS.LOCALE_MENU },
          { text: '🛡️ وضع الصيانة', callbackData: SETTINGS_CALLBACKS.MAINT_MENU },
        ],
        [{ text: '❌ إغلاق القائمة', callbackData: SETTINGS_CALLBACKS.CLOSE }],
      ]
    : [
        [
          { text: '🌐 Change Locale', callbackData: SETTINGS_CALLBACKS.LOCALE_MENU },
          { text: '🛡️ Maintenance', callbackData: SETTINGS_CALLBACKS.MAINT_MENU },
        ],
        [{ text: '❌ Close Menu', callbackData: SETTINGS_CALLBACKS.CLOSE }],
      ];

  return buildRichPage({
    title,
    headerIcon: '⚙️',
    bodyBlocks,
    footer: isRtl
      ? 'اختر أحد الخيارات لتعديل الإعدادات فورياً'
      : 'Select an option to update settings',
    buttons,
    isRtl,
  });
}

/**
 * Renders the language selection Rich Message page.
 */
export function renderLocaleSelectionPage(
  currentLocale: string,
  isRtl = true,
): RenderedRichMessage {
  const title = isRtl ? 'اختيار لغة النظام' : 'Select System Language';
  const bodyBlocks = isRtl
    ? [
        `اللغة الحالية هي: <b>${currentLocale === 'ar' ? 'العربية' : 'English'}</b>`,
        'اختر اللغة المطلوبة لتطبيقها فورياً على جميع واجهات المنصة:',
      ]
    : [
        `Current language is: <b>${currentLocale === 'ar' ? 'العربية' : 'English'}</b>`,
        'Select the target language to apply instantly across all platform surfaces:',
      ];

  const buttons: readonly (readonly InlineButton[])[] = [
    [
      { text: '🇸🇦 العربية', callbackData: SETTINGS_CALLBACKS.SET_LOCALE_AR },
      { text: '🇬🇧 English', callbackData: SETTINGS_CALLBACKS.SET_LOCALE_EN },
    ],
    [{ text: isRtl ? '🔙 عودة' : '🔙 Back', callbackData: SETTINGS_CALLBACKS.MAIN }],
  ];

  return buildRichPage({
    title,
    headerIcon: '🌐',
    bodyBlocks,
    buttons,
    isRtl,
  });
}

/**
 * Renders the maintenance mode management Rich Message page.
 */
export function renderMaintenanceMenuPage(
  settings: SystemSettingsRecord,
  isRtl = true,
): RenderedRichMessage {
  const title = isRtl ? 'إدارة أوضاع الصيانة' : 'Maintenance Mode Management';
  const bodyBlocks = isRtl
    ? [
        'يمكنك التحكم في وضع الصيانة لكل سطح بشكل مستقل، أو إيقاف المنصة بالكامل:',
        `• <b>البوت:</b> ${settings.botMaintenanceMode ? '🛑 معطل' : '🟢 مفعل'}`,
        `• <b>الميني اب:</b> ${settings.tmaMaintenanceMode ? '🛑 معطل' : '🟢 مفعل'}`,
        `• <b>المنصة ككل:</b> ${settings.isGlobalMaintenance ? '🛑 معطلة' : '🟢 مفعلة'}`,
      ]
    : [
        'You can toggle maintenance mode per surface independently, or globally:',
        `• <b>Bot:</b> ${settings.botMaintenanceMode ? '🛑 Disabled' : '🟢 Active'}`,
        `• <b>TMA:</b> ${settings.tmaMaintenanceMode ? '🛑 Disabled' : '🟢 Active'}`,
        `• <b>Global:</b> ${settings.isGlobalMaintenance ? '🛑 Suspended' : '🟢 Active'}`,
      ];

  const buttons: readonly (readonly InlineButton[])[] = isRtl
    ? [
        [
          { text: '🤖 تبديل البوت', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT },
          { text: '📱 تبديل TMA', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_TMA },
        ],
        [{ text: '🛡️ صيانة شاملة', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_GLOBAL }],
        [{ text: '🔙 عودة للرئيسية', callbackData: SETTINGS_CALLBACKS.MAIN }],
      ]
    : [
        [
          { text: '🤖 Toggle Bot', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT },
          { text: '📱 Toggle TMA', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_TMA },
        ],
        [{ text: '🛡️ Global Toggle', callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_GLOBAL }],
        [{ text: '🔙 Back to Menu', callbackData: SETTINGS_CALLBACKS.MAIN }],
      ];

  return buildRichPage({
    title,
    headerIcon: '🛡️',
    bodyBlocks,
    buttons,
    isRtl,
  });
}

/**
 * Renders an interactive confirmation card using buildRichConfirmation.
 */
export function renderMaintenanceConfirmCard(
  surface: 'bot' | 'tma' | 'all',
  targetActive: boolean,
  isRtl = true,
): RenderedRichMessage {
  const surfaceName =
    surface === 'bot' ? 'سطح البوت' : surface === 'tma' ? 'سطح الميني اب' : 'المنصة بالكامل';
  const actionName = targetActive ? 'تفعيل وضع الصيانة' : 'إلغاء وضع الصيانة وتشغيل السطح';

  const title = isRtl ? 'تأكيد تبديل وضع الصيانة' : 'Confirm Maintenance Toggle';
  const summaryLines = isRtl
    ? [
        `أنت على وشك: <b>${actionName}</b>`,
        `السطح المستهدف: <b>${surfaceName}</b>`,
        '',
        '⚠️ <i>سيتم تقييد وصول المستخدمين العاديين فور تأكيد هذا الإجراء.</i>',
      ]
    : [
        `You are about to: <b>${actionName}</b>`,
        `Target Surface: <b>${surfaceName}</b>`,
        '',
        '⚠️ <i>User ingress will be restricted immediately upon confirmation.</i>',
      ];

  return buildRichConfirmation({
    title,
    summaryLines,
    confirmCallback: `${SETTINGS_CALLBACKS.CONFIRM_PREFIX}${surface}:${targetActive ? 'on' : 'off'}`,
    cancelCallback: SETTINGS_CALLBACKS.MAINT_MENU,
    isRtl,
  });
}
