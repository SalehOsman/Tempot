import type { Context, NextFunction } from 'grammy';
import { answerCallback, editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { newTemplateCommand } from '../commands/new-template.command.js';
import { createMainMenu, createMyTemplatesMenu } from '../menus/template-menu.factory.js';
import { createBrowseMenu } from '../menus/browse-menu.factory.js';
import { createExportMenu } from '../menus/export-menu.factory.js';
import { createRatingMenu } from '../menus/rating-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();
type TranslationFn = (key: string) => string;
interface EditCallbackMessageInput {
  readonly ctx: Context;
  readonly text: string;
  readonly replyMarkup: Parameters<typeof editOrSend>[1]['replyMarkup'];
  readonly t: TranslationFn;
}

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
      await acknowledgeCallback(ctx);
      await newTemplateCommand(ctx);
      break;

    case 'export':
      await showExportOptions(ctx, t, parts);
      break;

    case 'rate':
      await showRatingOptions(ctx, t, parts);
      break;

    default:
      await acknowledgeCallback(ctx, t('bot-server.callback_unchanged'));
      break;
  }
}

async function showMainMenu(ctx: Context, t: TranslationFn): Promise<void> {
  await editCallbackMessage({
    ctx,
    text: t('template-management.menu.title'),
    replyMarkup: createMainMenu(t),
    t,
  });
}

async function showBrowseMenu(ctx: Context, t: TranslationFn): Promise<void> {
  await editCallbackMessage({
    ctx,
    text: t('template-management.browse.title'),
    replyMarkup: createBrowseMenu(t),
    t,
  });
}

async function showMyTemplates(ctx: Context, t: TranslationFn): Promise<void> {
  await editCallbackMessage({
    ctx,
    text: t('template-management.menu.my_templates'),
    replyMarkup: createMyTemplatesMenu({ t, templates: [], page: 0, totalPages: 1 }),
    t,
  });
}

async function showExportOptions(ctx: Context, t: TranslationFn, parts: string[]): Promise<void> {
  const templateId = parts[2];
  const format = parts[3];
  if (!templateId || format) {
    await acknowledgeCallback(ctx, t('bot-server.callback_unchanged'));
    return;
  }
  await editCallbackMessage({
    ctx,
    text: t('template-management.actions.export'),
    replyMarkup: createExportMenu(t, templateId),
    t,
  });
}

async function showRatingOptions(ctx: Context, t: TranslationFn, parts: string[]): Promise<void> {
  const templateId = parts[2];
  const stars = parts[3];
  if (!templateId || stars) {
    await acknowledgeCallback(ctx, t('bot-server.callback_unchanged'));
    return;
  }
  await editCallbackMessage({
    ctx,
    text: t('template-management.rating.title'),
    replyMarkup: createRatingMenu(t, templateId),
    t,
  });
}

async function editCallbackMessage(input: EditCallbackMessageInput): Promise<void> {
  const result = await editOrSend(input.ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: input.text,
    replyMarkup: input.replyMarkup,
    unchangedCallbackText: input.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function acknowledgeCallback(ctx: Context, text?: string): Promise<void> {
  const result = await answerCallback(ctx as unknown as Parameters<typeof answerCallback>[0], {
    text,
  });
  if (result.isErr()) throw result.error;
}
