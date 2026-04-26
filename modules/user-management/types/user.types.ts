/**
 * User domain types — متزامنة مع RoleEnum من @tempot/auth-core
 * الأدوار المعتمدة: GUEST | USER | ADMIN | SUPER_ADMIN (4 فقط)
 */
import { RoleEnum } from '@tempot/auth-core';

export interface UserProfile {
  id: string;
  telegramId: string;
  username?: string;
  email?: string;
  language: string;
  role: RoleEnum;
  createdAt: Date;
  updatedAt: Date;

  // Identity fields (Egypt regional context)
  nationalId?: string;
  mobileNumber?: string;
  birthDate?: Date;
  gender?: 'male' | 'female';
  governorate?: string;
  countryCode?: string;

  // Stats fields (للعرض فقط — محسوبة وليست مخزنة)
  messageCount?: number;
  completedTasks?: number;
  activeTime?: string;
  rating?: string;
}

/** نوع الدور يُشير مباشرة إلى RoleEnum — لا تكرار */
export type UserRole = RoleEnum;

export interface UpdateUserData {
  username?: string;
  email?: string;
  language?: string;
  role?: RoleEnum;
  nationalId?: string;
  mobileNumber?: string;
  birthDate?: Date;
  gender?: 'male' | 'female';
  governorate?: string;
  countryCode?: string;
}

export interface UserSearchResult {
  users: UserProfile[];
  totalCount: number;
  page: number;
  pageSize: number;
}
