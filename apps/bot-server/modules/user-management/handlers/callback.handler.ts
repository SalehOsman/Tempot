import { Context } from 'grammy';

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery('هذا الإجراء قيد التطوير...');
}
