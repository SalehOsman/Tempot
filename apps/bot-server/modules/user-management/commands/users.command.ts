import { Context } from 'grammy';

export async function usersCommand(ctx: Context): Promise<void> {
  await ctx.reply('👥 إدارة المستخدمين\n\nهذا الأمر قيد التطوير...');
}
