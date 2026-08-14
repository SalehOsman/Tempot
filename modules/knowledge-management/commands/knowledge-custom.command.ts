import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createKnowledgeMenu } from '../menus/knowledge-menu.factory.js';
import { KnowledgeViewService } from '../services/knowledge-view.service.js';

interface CustomCommandInput {
  readonly name: string;
  readonly root: string;
  readonly description: string;
}

export async function knowledgeCustomCommand(ctx: Context): Promise<void> {
  const { i18n, knowledge } = getDeps();
  const input = parseCustomCommand(ctx.message?.text ?? '');
  if (!input) {
    await ctx.reply(i18n.t('knowledge-management.view.custom_hint'), {
      parse_mode: 'HTML',
      reply_markup: createKnowledgeMenu(i18n.t, 'leaf'),
    });
    return;
  }
  const service = new KnowledgeViewService(knowledge);
  await ctx.reply(await service.renderCustomCreated(i18n.t, actorId(ctx), input), {
    parse_mode: 'HTML',
    reply_markup: createKnowledgeMenu(i18n.t, 'leaf'),
  });
}

function parseCustomCommand(text: string): CustomCommandInput | undefined {
  const body = text.replace(/^\/knowledge_custom(@\w+)?\s*/u, '').trim();
  const parts = body.split('|').map((part) => part.trim());
  if (parts.length < 2 || !parts[0] || !parts[1]) return undefined;
  return { name: parts[0], root: parts[1], description: parts[2] ?? '' };
}

function actorId(ctx: Context): string {
  return ctx.from?.id ? String(ctx.from.id) : 'unknown';
}
