import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export class HelpContentService {
  constructor(
    private readonly config: ModuleConfig,
    private readonly getMainMenuItems?: (role: UserRole) => readonly ModuleNavigationItem[],
  ) {}

  renderCommands(t: TranslationFn, role: UserRole): string {
    const commandItems = this.config.commands.map((command) =>
      t('help-center.view.command_item', {
        command: escapeHtml(`/${command.command}`),
        description: escapeHtml(t(command.description)),
      }),
    );
    const menuItems = (this.getMainMenuItems?.(role) ?? []).map((item) =>
      t('help-center.view.menu_item', {
        label: escapeHtml(t(item.labelKey)),
        callbackData: escapeHtml(item.callbackData),
        requiredRole: escapeHtml(item.requiredRole),
      }),
    );
    return [
      t('help-center.view.commands_title'),
      t('help-center.view.commands_intro'),
      ...emptyFallback(commandItems, t('help-center.view.commands_empty')),
      t('help-center.view.menu_title'),
      ...emptyFallback(menuItems, t('help-center.view.menu_empty')),
    ].join('\n\n');
  }

  renderSupport(t: TranslationFn, userId?: number, chatId?: number): string {
    return [
      t('help-center.view.support_title'),
      t('help-center.view.support_intro'),
      t('help-center.view.support_context', {
        userId: escapeHtml(String(userId ?? '-')),
        chatId: escapeHtml(String(chatId ?? '-')),
      }),
      t('help-center.view.support_steps'),
    ].join('\n\n');
  }
}

function emptyFallback(items: string[], fallback: string): string[] {
  return items.length > 0 ? items : [fallback];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
