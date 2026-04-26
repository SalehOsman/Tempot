import { RoleEnum } from '@tempot/auth-core';

export interface NavigationState {
  action: string;
  userId?: string;
  pendingRoleChange?: {
    userId: string;
    newRole: RoleEnum;
  };
  timestamp: number;
}

export interface ProfileEditState {
  field: 'name' | 'email' | 'language';
  userId: string;
  timestamp: number;
}

export interface UserSearchState {
  query: string;
  page: number;
  timestamp: number;
}
