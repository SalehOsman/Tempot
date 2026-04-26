/**
 * UserService Context — instance واحد للـ service طوال عمر الموديول
 *
 * يُنشأ مرة واحدة في setup() ثم يُستخدم في كل مكان.
 * يحل محل الـ static methods في UserService القديم.
 */

import { UserService } from './user.service.js';
import { getLogger } from '../deps.context.js';

let _service: UserService | null = null;

export function initUserService(): void {
  const log = getLogger();
  _service = new UserService({
    log: async (data: Record<string, unknown>) => log.debug(data),
  });
}

export function getUserService(): UserService {
  if (!_service) {
    throw new Error('[user-management] getUserService() called before initUserService()');
  }
  return _service;
}
