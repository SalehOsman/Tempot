import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createMainMenu } from '../menus/template-menu.factory.js';
import { createBrowseMenu } from '../menus/browse-menu.factory.js';
import { createExportMenu } from '../menus/export-menu.factory.js';
import { createRatingMenu } from '../menus/rating-menu.factory.js';

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith('tmpl:')) return;

  const { i18n } = getDeps();
  const t = (key: string) => i18n.t(key);

  await ctx.answerCallbackQuery();

  const parts = data.split(':');
  const action = parts[1];

  switch (action) {
    case 'menu':
      await ctx.editMessageText(t('template-management.menu.title'), {
        reply_markup: createMainMenu(t),
      });
      break;

    case 'browse':
      await ctx.editMessageText(t('template-management.browse.title'), {
        reply_markup: createBrowseMenu(t),
      });
      break;

    case 'export': {
      const templateId = parts[2];
      const format = parts[3];
      if (!templateId) break;
      if (!format) {
        await ctx.editMessageText(t('template-management.actions.export'), {
          reply_markup: createExportMenu(t, templateId),
        });
      }
      break;
    }

    case 'rate': {
      const templateId = parts[2];
      const stars = parts[3];
      if (!templateId) break;
      if (!stars) {
        await ctx.editMessageText(t('template-management.rating.title'), {
          reply_markup: createRatingMenu(t, templateId),
        });
      }
      break;
    }

    default:
      break;
  }
}
