import { InlineKeyboard } from 'grammy';
import type { ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

const ROLE_LEVELS: Record<UserRole, number> = {
  GUEST: 1,
  USER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export class MainMenuFactory {
  static create(
    user: UserProfile,
    i18n: ModuleI18n,
    entries: readonly ModuleNavigationItem[] = [],
  ): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    let currentRow: number | null = null;
    let hasButtons = false;

    for (const entry of this.visibleEntries(user.role, entries)) {
      if (hasButtons && currentRow !== entry.row) {
        keyboard.row();
      }
      keyboard.text(i18n.t(entry.labelKey), entry.callbackData);
      currentRow = entry.row;
      hasButtons = true;
    }

    return keyboard;
  }

  private static visibleEntries(
    role: UserRole,
    entries: readonly ModuleNavigationItem[],
  ): readonly ModuleNavigationItem[] {
    return entries
      .filter((entry) => ROLE_LEVELS[role] >= ROLE_LEVELS[entry.requiredRole])
      .sort((left, right) => left.row - right.row || left.order - right.order);
  }
}
