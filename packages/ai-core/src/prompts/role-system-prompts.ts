/** Get system prompt i18n key for a given role (D1: AI as bot tool, not chatbot) */
export function getSystemPrompt(role: string, _language: string): string {
  // System prompts are loaded from i18n at runtime
  // These are the i18n key patterns — actual text comes from locale files
  const prompts: Record<string, string> = {
    super_admin: 'ai-core.system_prompt.super_admin',
    admin: 'ai-core.system_prompt.admin',
    user: 'ai-core.system_prompt.user',
  };

  return prompts[role] ?? prompts.user;
}
