/**
 * Menu types — callback_data values يجب أن تطابق ما يُرسل ويُستقبل.
 * MODERATOR محذوف — الأدوار المعتمدة 4 فقط: GUEST | USER | ADMIN | SUPER_ADMIN
 */

export type MenuAction =
  // Profile actions
  | 'profile:view'
  | 'profile:edit'
  | 'profile:edit:name'
  | 'profile:edit:email'
  | 'profile:edit:language'
  | 'profile:stats'

  // Users actions
  | 'users:list'
  | 'users:search'
  | 'users:view'
  | 'users:role'
  | 'users:role:confirm'
  | 'users:role:cancel'

  // Menu actions
  | 'menu:main'

  // Settings actions
  | 'settings:view'

  // Notifications actions
  | 'notifications:view'

  // Messages actions
  | 'messages:view'

  // Stats actions
  | 'stats:view'

  // Help actions
  | 'help:view';

export interface MenuButton {
  text: string;
  callback_data: MenuAction;
}

export interface MenuRow {
  buttons: MenuButton[];
}

export interface Menu {
  inline_keyboard: MenuRow[];
}
