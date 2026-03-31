import { RoleEnum } from './auth.roles.js';

export interface SessionUser {
  id: string | number;
  role: RoleEnum | `${RoleEnum}`;
  [key: string]: unknown;
}
