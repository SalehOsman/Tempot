import { RoleEnum } from './auth.roles.js';

export type SessionUserStatus = 'ACTIVE' | 'BANNED' | 'PENDING' | 'UNRESOLVED';

export interface SessionUser {
  id: string | number;
  role: RoleEnum | `${RoleEnum}`;
  status?: SessionUserStatus;
  [key: string]: unknown;
}
