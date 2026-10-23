import {
  type InlineButton,
  type RenderedRichMessage,
  buildRichConfirmation,
  buildRichPage,
} from '@tembot/core-components';
import type { SystemSettingsRecord } from '../db/schema.js';
import { getSystemSettingsLocale } from '../locales/index.js';

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
  const dict = getSystemSettingsLocale(isRtl ? 'ar' : 'en');
  const tmaLabel = dict.replyKeyboard.tmaButton;
  const settingsLabel = dict.replyKeyboard.settingsButton;

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
  const dict = getSystemSettingsLocale(isRtl ? 'ar' : 'en');
  const title = dict.mainPage.title;
  const localeText =
    settings.defaultLocale === 'ar' ? dict.mainPage.localeArabic : dict.mainPage.localeEnglish;
  const botStatus = settings.botMaintenanceMode
    ? dict.mainPage.statusMaintenance
    : dict.mainPage.statusActive;
  const tmaStatus = settings.tmaMaintenanceMode
    ? dict.mainPage.statusMaintenance
    : dict.mainPage.statusActive;
  const globalStatus = settings.isGlobalMaintenance
    ? dict.mainPage.statusSuspended
    : dict.mainPage.statusActive;

  const bodyBlocks = [
    `🏢 <b>${dict.mainPage.platformName}:</b> ${settings.platformName}`,
    `🌐 <b>${dict.mainPage.defaultLocale}:</b> ${localeText}`,
    `🤖 <b>${dict.mainPage.botSurface}:</b> ${botStatus}`,
    `📱 <b>${dict.mainPage.tmaSurface}:</b> ${tmaStatus}`,
    `🛡️ <b>${dict.mainPage.globalStatus}:</b> ${globalStatus}`,
    `🎨 <b>${dict.mainPage.brandColor}:</b> <code>${settings.tmaPrimaryColor}</code>`,
  ];

  const buttons: readonly (readonly InlineButton[])[] = [
    [
      { text: dict.mainPage.changeLocaleButton, callbackData: SETTINGS_CALLBACKS.LOCALE_MENU },
      { text: dict.mainPage.maintenanceButton, callbackData: SETTINGS_CALLBACKS.MAINT_MENU },
    ],
    [{ text: dict.mainPage.closeButton, callbackData: SETTINGS_CALLBACKS.CLOSE }],
  ];

  return buildRichPage({
    title,
    headerIcon: '⚙️',
    bodyBlocks,
    footer: dict.mainPage.footerHint,
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
  const dict = getSystemSettingsLocale(isRtl ? 'ar' : 'en');
  const title = dict.localeSelection.title;
  const activeLocaleName =
    currentLocale === 'ar' ? dict.mainPage.localeArabic : dict.mainPage.localeEnglish;

  const bodyBlocks = [
    `${dict.localeSelection.currentLocaleIntro}: <b>${activeLocaleName}</b>`,
    dict.localeSelection.choosePrompt,
  ];

  const buttons: readonly (readonly InlineButton[])[] = [
    [
      { text: dict.localeSelection.arabicOption, callbackData: SETTINGS_CALLBACKS.SET_LOCALE_AR },
      { text: dict.localeSelection.englishOption, callbackData: SETTINGS_CALLBACKS.SET_LOCALE_EN },
    ],
    [{ text: dict.localeSelection.backButton, callbackData: SETTINGS_CALLBACKS.MAIN }],
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
  const dict = getSystemSettingsLocale(isRtl ? 'ar' : 'en');
  const title = dict.maintenance.title;

  const botStatus = settings.botMaintenanceMode
    ? dict.maintenance.disabledState
    : dict.maintenance.activeState;
  const tmaStatus = settings.tmaMaintenanceMode
    ? dict.maintenance.disabledState
    : dict.maintenance.activeState;
  const globalStatus = settings.isGlobalMaintenance
    ? dict.maintenance.disabledState
    : dict.maintenance.activeState;

  const bodyBlocks = [
    dict.maintenance.bodyIntro,
    `• <b>${dict.maintenance.botLabel}:</b> ${botStatus}`,
    `• <b>${dict.maintenance.tmaLabel}:</b> ${tmaStatus}`,
    `• <b>${dict.maintenance.globalLabel}:</b> ${globalStatus}`,
  ];

  const buttons: readonly (readonly InlineButton[])[] = [
    [
      { text: dict.maintenance.toggleBotButton, callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT },
      { text: dict.maintenance.toggleTmaButton, callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_TMA },
    ],
    [{ text: dict.maintenance.toggleGlobalButton, callbackData: SETTINGS_CALLBACKS.TOGGLE_MAINT_GLOBAL }],
    [{ text: dict.maintenance.backButton, callbackData: SETTINGS_CALLBACKS.MAIN }],
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
  const dict = getSystemSettingsLocale(isRtl ? 'ar' : 'en');
  const surfaceName =
    surface === 'bot'
      ? dict.maintenance.botSurfaceName
      : surface === 'tma'
        ? dict.maintenance.tmaSurfaceName
        : dict.maintenance.globalSurfaceName;

  const actionName = targetActive
    ? dict.maintenance.enableAction
    : dict.maintenance.disableAction;

  const title = dict.maintenance.confirmTitle;
  const summaryLines = [
    `${dict.maintenance.confirmIntro}: <b>${actionName}</b>`,
    `${dict.maintenance.targetSurfaceIntro}: <b>${surfaceName}</b>`,
    '',
    dict.maintenance.warningNote,
  ];

  return buildRichConfirmation({
    title,
    summaryLines,
    confirmCallback: `${SETTINGS_CALLBACKS.CONFIRM_PREFIX}${surface}:${targetActive ? 'on' : 'off'}`,
    cancelCallback: SETTINGS_CALLBACKS.MAINT_MENU,
    isRtl,
  });
}
