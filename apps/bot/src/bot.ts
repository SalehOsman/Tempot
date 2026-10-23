import { createChildLogger } from '@tembot/logger';
import {
  SETTINGS_CALLBACKS,
  type SettingsService,
  TelegramSettingsRouter,
  buildPersistentReplyKeyboard,
} from '@tembot/module-system-settings';
import { Bot, type Context, InlineKeyboard } from 'grammy';

const botLogger = createChildLogger({ module: 'app-bot', slice: 'telegram' });

export interface BotDependencies {
  readonly settingsService?: SettingsService;
  readonly defaultTenantId?: string;
  readonly tmaUrl?: string;
}

/**
 * Creates and configures the Sovereign grammY Telegram Bot.
 */
export function createBot(token: string, deps: BotDependencies = {}) {
  const bot = new Bot(token);
  const tenantId = deps.defaultTenantId ?? '00000000-0000-0000-0000-000000000000';
  const router = deps.settingsService
    ? new TelegramSettingsRouter(deps.settingsService)
    : undefined;

  // Global Error Handler
  bot.catch((err) => {
    botLogger.error(
      { error: err.error, ctx: err.ctx?.update?.update_id },
      'Unhandled exception in grammY update cycle',
    );
  });

  // /start command handler
  bot.command('start', async (ctx: Context) => {
    const user = ctx.from;
    const actorId = user ? `tg:${user.id}` : 'tg:unknown';

    let botName = 'Tembot';
    let welcomeMessage = 'مرحباً بك في منصة تيمبوت السيادية!';

    if (deps.settingsService) {
      const res = await deps.settingsService.getSurfaceSettings(tenantId, 'bot');
      if (res.isOk() && 'botName' in res.value) {
        botName = res.value.botName;
        welcomeMessage = res.value.welcomeMessage;
      }
    }

    const greetingHtml = `<b>🤖 ${botName}</b>\n\n${welcomeMessage}\n\n<i>استخدم القائمة أدناه أو زر ⚙️ الإعدادات للتحكم.</i>`;

    await ctx.reply(greetingHtml, {
      parse_mode: 'HTML',
      reply_markup: buildPersistentReplyKeyboard({ tmaUrl: deps.tmaUrl }),
    });

    botLogger.info({ actorId, username: user?.username }, 'User executed /start command');
  });

  // TMA Button handler when HTTPS web_app is not configured
  bot.hears(['🚀 فتح التطبيق', 'فتح التطبيق'], async (ctx: Context) => {
    await ctx.reply(
      '📱 <b>تطبيق التليجرام المصغر (TMA)</b>\n\n' +
        'يشترط تيليجرام رابطاً آمناً <b>HTTPS</b> لفتح النوافذ المنبثقة مباشرة داخل التطبيق.\n\n' +
        '🔗 <b>رابط المعاينة المحلية بالمتصفح:</b>\nhttp://localhost:5173\n\n' +
        '💡 <i>عند رفع المنصة لسيرفر أو تشغيل نفق محلي (ngrok/cloudflared)، ضع الرابط في متغير TMA_URL وسيفتح داخل التليجرام بضغطة زر.</i>',
      { parse_mode: 'HTML' },
    );
  });

  // Persistent Keyboard Settings Button or command
  bot.hears(['⚙️ الإعدادات', 'الإعدادات', '/settings'], async (ctx: Context) => {
    if (!router) {
      await ctx.reply('⚙️ نظام الإعدادات قيد التهيئة...');
      return;
    }

    const user = ctx.from;
    const actorId = user ? `tg:${user.id}` : 'tg:unknown';

    const menuRes = await router.handleCallback(SETTINGS_CALLBACKS.MAIN, {
      tenantId,
      actorId,
      isOperator: true,
    });

    if (menuRes.isErr() || !menuRes.value) {
      await ctx.reply('تعذر فتح قائمة الإعدادات حالياً.');
      return;
    }

    const rendered = menuRes.value;
    const inlineKeyboard = new InlineKeyboard();

    if (rendered.buttons) {
      for (const row of rendered.buttons) {
        const keyboardRow = row.map((btn) => {
          if (btn.url) {
            return InlineKeyboard.url(btn.text, btn.url);
          }
          if (btn.webAppUrl) {
            return InlineKeyboard.webApp(btn.text, btn.webAppUrl);
          }
          return InlineKeyboard.text(btn.text, btn.callbackData ?? 'noop');
        });
        inlineKeyboard.row(...keyboardRow);
      }
    }

    await ctx.reply(rendered.text, {
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });
  });

  // Handle Settings Callback Queries
  bot.on('callback_query:data', async (ctx: Context) => {
    const data = ctx.callbackQuery?.data;
    if (!data || !data.startsWith('cfg:')) return;

    if (!router) {
      await ctx.answerCallbackQuery({ text: 'النظام قيد التهيئة' });
      return;
    }

    const user = ctx.from;
    const actorId = user ? `tg:${user.id}` : 'tg:unknown';

    const actionRes = await router.handleCallback(data, {
      tenantId,
      actorId,
      isOperator: true,
    });

    await ctx.answerCallbackQuery();

    if (actionRes.isErr() || !actionRes.value) {
      return;
    }

    const rendered = actionRes.value;
    const inlineKeyboard = new InlineKeyboard();

    if (rendered.buttons) {
      for (const row of rendered.buttons) {
        const keyboardRow = row.map((btn) => {
          if (btn.url) {
            return InlineKeyboard.url(btn.text, btn.url);
          }
          if (btn.webAppUrl) {
            return InlineKeyboard.webApp(btn.text, btn.webAppUrl);
          }
          return InlineKeyboard.text(btn.text, btn.callbackData ?? 'noop');
        });
        inlineKeyboard.row(...keyboardRow);
      }
    }

    try {
      await ctx.editMessageText(rendered.text, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
    } catch {
      // In case editMessageText is identical or impossible
    }
  });

  return bot;
}
