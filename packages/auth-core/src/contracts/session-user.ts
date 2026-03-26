import { RoleEnum } from './roles.js';

export interface SessionUser {
  id: string | number;
  role: RoleEnum | `${RoleEnum}`;
  [key: string]: unknown;
}
