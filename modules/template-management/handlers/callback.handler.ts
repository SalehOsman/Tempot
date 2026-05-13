import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { newTemplateCommand } from '../commands/new-template.command.js';
import { createMainMenu, createMyTemplatesMenu } from '../menus/template-menu.factory.js';
import { createBrowseMenu } from '../menus/browse-menu.factory.js';
import { createExportMenu } from '../menus/export-menu.factory.js';
import { createRatingMenu } from '../menus/rating-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();
type TranslationFn = (key: string) => string;

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith('tmpl:')) {
    await next();
    return;
  }

  const { i18n } = getDeps();
  const t = (key: string) => i18n.t(key);

  await ctx.answerCallbackQuery();

  const parts = data.split(':');
  const action = parts[1];

  switch (action) {
    case 'menu':
      await showMainMenu(ctx, t);
      break;

    case 'browse':
      await showBrowseMenu(ctx, t);
      break;

    case 'my':
      await showMyTemplates(ctx, t);
      break;

    case 'create':
      await newTemplateCommand(ctx);
      break;

    case 'export':
      await showExportOptions(ctx, t, parts);
      break;

    case 'rate':
      await showRatingOptions(ctx, t, parts);
      break;

    default:
      break;
  }
}

async function showMainMenu(ctx: Context, t: TranslationFn): Promise<void> {
  await ctx.editMessageText(t('template-management.menu.title'), {
    reply_markup: createMainMenu(t),
  });
}

async function showBrowseMenu(ctx: Context, t: TranslationFn): Promise<void> {
  await ctx.editMessageText(t('template-management.browse.title'), {
    reply_markup: createBrowseMenu(t),
  });
}

async function showMyTemplates(ctx: Context, t: TranslationFn): Promise<void> {
  await ctx.editMessageText(t('template-management.menu.my_templates'), {
    reply_markup: createMyTemplatesMenu({ t, templates: [], page: 0, totalPages: 1 }),
  });
}

async function showExportOptions(ctx: Context, t: TranslationFn, parts: string[]): Promise<void> {
  const templateId = parts[2];
  const format = parts[3];
  if (!templateId || format) return;
  await ctx.editMessageText(t('template-management.actions.export'), {
    reply_markup: createExportMenu(t, templateId),
  });
}

async function showRatingOptions(ctx: Context, t: TranslationFn, parts: string[]): Promise<void> {
  const templateId = parts[2];
  const stars = parts[3];
  if (!templateId || stars) return;
  await ctx.editMessageText(t('template-management.rating.title'), {
    reply_markup: createRatingMenu(t, templateId),
  });
}
