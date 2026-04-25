import { Context } from 'grammy';

export async function handleTextInput(ctx: Context): Promise<void> {
  await ctx.reply('هذا الإجراء قيد التطوير...');
}
