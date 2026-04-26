import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../repositories/user.repository.js';

export class RoleService {
  private static repository: UserRepository | null = null;

  private static getRepository(): UserRepository {
    if (!this.repository) {
      const auditLogger = {
        log: async (_data: Record<string, unknown>) => {
          // Audit logging will be implemented later
        },
      };
      this.repository = new UserRepository(auditLogger);
    }
    return this.repository;
  }

  static async changeRole(userId: string, newRole: RoleEnum): Promise<Result<void, AppError>> {
    try {
      const result = await this.getRepository().updateRole(userId, newRole);
      return result;
    } catch (e) {
      return ok(new AppError('user-management.role_change_failed', e) as unknown as void);
    }
  }
}
