import { RoleEnum } from '@tempot/auth-core';

export interface UserProfile {
  id: string;
  telegramId: string;
  username?: string;
  email?: string;
  language: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  // Optional fields for display
  messageCount?: number;
  completedTasks?: number;
  activeTime?: string;
  rating?: string;
}

export type UserRole = RoleEnum;

export interface UpdateUserData {
  username?: string;
  email?: string;
  language?: string;
}

export interface UserSearchResult {
  users: UserProfile[];
  totalCount: number;
  page: number;
  pageSize: number;
}
