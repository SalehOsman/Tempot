import type { Context } from 'grammy';

export async function handleTextInput(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  // Text handler will be expanded when wizard state management is connected
  // Currently a stub for the module registration
}
