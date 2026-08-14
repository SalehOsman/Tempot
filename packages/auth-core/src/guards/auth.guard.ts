import { AnyAbility } from '@casl/ability';
import { err, ok } from 'neverthrow';
import { AppError, Result } from '@tempot/shared';
import { AppAction } from '../contracts/auth.actions.js';
import { AppSubject } from '../contracts/auth.subjects.js';
import { authToggle } from '../auth.toggle.js';

export class Guard {
  static enforce(
    ability: AnyAbility,
    action: AppAction,
    subject: AppSubject,
  ): Result<void, AppError> {
    const disabled = authToggle.check();
    if (disabled) return disabled;

    if (ability.can(action, subject)) {
      return ok(undefined);
    }

    return err(new AppError('auth.forbidden', { action, subject }));
  }
}
