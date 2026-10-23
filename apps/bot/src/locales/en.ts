import type { BotLocaleDictionary } from './ar.js';

export const en: BotLocaleDictionary = {
  greeting: {
    defaultWelcome: 'Welcome to the Sovereign Tembot Platform!',
    guideHint: 'Use the menu below or the ⚙️ Settings button to manage your options.',
    openTmaDirectPrompt: '📱 You can also launch the Mini App directly via this button:',
    openTmaInlineButton: '🚀 Open Mini App in Telegram',
  },
  tma: {
    buttonHears: ['🚀 Open App', 'Open App', '🚀 فتح التطبيق', 'فتح التطبيق'],
    readyTitle: '📱 <b>Telegram Mini App (TMA) is Ready!</b>',
    openNowInlineButton: '🚀 Tap here to launch Mini App now',
    directOpenInstruction: 'Tap the button below to launch the Mini App directly inside Telegram:',
    httpsRequiredTitle: '📱 <b>Telegram Mini App (TMA)</b>',
    httpsRequiredBody:
      'Telegram strictly requires a secure <b>HTTPS</b> URL to launch popup windows inside the app.',
    localPreviewLabel: '🔗 <b>Browser Preview URL:</b>',
    productionTip:
      '💡 <i>When deploying or running a tunnel (ngrok/cloudflared), configure the URL in TMA_URL to open with 1-tap.</i>',
  },
  settings: {
    buttonHears: ['⚙️ Settings', 'Settings', '/settings', '⚙️ الإعدادات', 'الإعدادات'],
    initializing: '⚙️ Settings engine is initializing...',
    openFailed: 'Unable to open settings menu at this time.',
    callbackInitializing: 'System is initializing',
    localeChanged: '✅ Language switched to English successfully.',
  },
};
