import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';

export async function newTemplateCommand(ctx: Context): Promise<void> {
  const { i18n } = getDeps();
  const t = (key: string) => i18n.t(key);

  await ctx.reply(t('template-management.wizard.step_name'));
}
