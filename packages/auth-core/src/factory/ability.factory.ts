import { AnyAbility, createMongoAbility } from '@casl/ability';
import { ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { SessionUser } from '../contracts/session.types.js';
import { authToggle } from '../auth.toggle.js';

export type AbilityDefinition = (user: SessionUser) => AnyAbility;

export class AbilityFactory {
  static build(user: SessionUser, definitions: AbilityDefinition[]): Result<AnyAbility, AppError> {
    const disabled = authToggle.check();
    if (disabled) return disabled;

    const rules = definitions.flatMap((def) => def(user).rules);
    return ok(createMongoAbility(rules));
  }
}
