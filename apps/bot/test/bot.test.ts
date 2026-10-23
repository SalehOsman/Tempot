import { buildPersistentReplyKeyboard } from '@tembot/module-system-settings';
import { describe, expect, it } from 'vitest';
import { createBot } from '../src/bot.js';

describe('Tembot grammY Bot Ingress Runner', () => {
  const FAKE_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

  it('creates bot instance and registers standard commands', () => {
    const bot = createBot(FAKE_TOKEN);
    expect(bot).toBeDefined();
    expect(bot.token).toBe(FAKE_TOKEN);
  });

  it('generates persistent reply keyboard with settings button and TMA button', () => {
    const keyboard = buildPersistentReplyKeyboard({
      tmaUrl: 'https://tembot.example.com/tma',
      isRtl: true,
    });

    expect(keyboard.is_persistent).toBe(true);
    expect(keyboard.resize_keyboard).toBe(true);
    expect(keyboard.keyboard.length).toBe(1);
    expect(keyboard.keyboard[0].length).toBe(2);

    const [tmaBtn, settingsBtn] = keyboard.keyboard[0];
    expect(tmaBtn.text).toBe('🚀 فتح التطبيق');
    expect(tmaBtn.web_app?.url).toBe('https://tembot.example.com/tma');
    expect(settingsBtn.text).toBe('⚙️ الإعدادات');
  });

  it('generates persistent keyboard in LTR English mode when specified', () => {
    const keyboard = buildPersistentReplyKeyboard({
      isRtl: false,
    });

    const [tmaBtn, settingsBtn] = keyboard.keyboard[0];
    expect(tmaBtn.text).toBe('🚀 Open App');
    expect(settingsBtn.text).toBe('⚙️ Settings');
  });
});
