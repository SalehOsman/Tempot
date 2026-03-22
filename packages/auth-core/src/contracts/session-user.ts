import { RoleEnum } from './roles';

export interface SessionUser {
  id: string | number;
  role: RoleEnum | `${RoleEnum}`;
  [key: string]: unknown;
}
