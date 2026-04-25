import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../repositories/user.repository';

export class RoleService {
  static async changeRole(userId: string, newRole: RoleEnum): Promise<Result<void, AppError>> {
    // Validate role
    if (!Object.values(RoleEnum).includes(newRole)) {
      return Result.err(new AppError('invalid_role', 'Invalid role'));
    }

    // Get user
    const userResult = await UserRepository.findById(userId);
    if (userResult.isErr()) {
      return userResult;
    }

    const user = userResult.value;

    // Check if role is already the same
    if (user.role === newRole) {
      return Result.ok(undefined);
    }

    // Update role
    const updateResult = await UserRepository.updateRole(userId, newRole);
    if (updateResult.isErr()) {
      return updateResult;
    }

    // Invalidate cache
    // await UserService.invalidateCache(user.telegramId);

    // Publish event
    // await eventBus.emit('user-management.role.changed', { userId, oldRole: user.role, newRole });

    return Result.ok(undefined);
  }
}
