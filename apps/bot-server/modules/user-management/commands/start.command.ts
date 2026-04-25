import { Context } from 'grammy';

export async function startCommand(ctx: Context): Promise<void> {
  await ctx.reply('👋 مرحباً بك في Tempot\n\nهذا الأمر قيد التطوير...');
}
