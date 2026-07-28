import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createKnowledgeMenu } from '../menus/knowledge-menu.factory.js';

export async function knowledgeCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(i18n.t('knowledge-management.view.title'), {
    parse_mode: 'HTML',
    reply_markup: createKnowledgeMenu(i18n.t),
  });
}
