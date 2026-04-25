import { Context } from 'grammy';

export async function profileCommand(ctx: Context): Promise<void> {
  await ctx.reply('👤 ملفك الشخصي\n\nهذا الأمر قيد التطوير...');
}
