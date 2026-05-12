export type BotManagementView =
  | 'list'
  | 'detail'
  | 'create'
  | 'lifecycle'
  | 'settings'
  | 'modules'
  | 'provisioning'
  | 'health'
  | 'export'
  | 'import';

export interface BotNavigationState {
  view: BotManagementView;
  botId?: string;
  page?: number;
}
