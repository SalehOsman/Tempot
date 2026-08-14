export type InteractionUpdateType = 'command' | 'callback_query' | 'message';

const CALLBACK_NAMESPACE_MODULES: Record<string, string> = {
  botmgmt: 'bot-management',
  'bot-management': 'bot-management',
  ie: 'input-engine',
  tmpl: 'template-management',
  'template-management': 'template-management',
  settings: 'settings-management',
  notifications: 'notification-center',
  messages: 'content-management',
  stats: 'audit-viewer',
  help: 'help-center',
  users: 'user-management',
  profile: 'user-management',
  menu: 'bot-server',
};

export function extractCommand(text: string | undefined): string | undefined {
  if (!text?.startsWith('/')) return undefined;
  return text.split(' ')[0];
}

export function extractCallbackNamespace(callbackData: string | undefined): string | undefined {
  if (!callbackData) return undefined;
  const separatorIndex = callbackData.search(/[:.]/);
  if (separatorIndex <= 0) return callbackData;
  return callbackData.slice(0, separatorIndex);
}

export function resolveInteractionModule(
  command: string | undefined,
  callbackNamespace: string | undefined,
  commandModuleMap: Record<string, string> | undefined,
): string {
  if (command) return commandModuleMap?.[command] ?? 'bot-server';
  if (callbackNamespace) return CALLBACK_NAMESPACE_MODULES[callbackNamespace] ?? callbackNamespace;
  return 'bot-server';
}

export function resolveUpdateType(
  command: string | undefined,
  hasCallbackQuery: boolean,
): InteractionUpdateType {
  if (command) return 'command';
  if (hasCallbackQuery) return 'callback_query';
  return 'message';
}
