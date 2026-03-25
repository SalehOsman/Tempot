import { AnyAbility, createMongoAbility } from '@casl/ability';
import { ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { SessionUser } from '../contracts/session-user';

export type AbilityDefinition = (user: SessionUser) => AnyAbility;

export class AbilityFactory {
  static build(
    user: SessionUser,
    definitions: AbilityDefinition[],
  ): Result<AnyAbility, AppError> {
    const rules = definitions.flatMap((def) => def(user).rules);
    return ok(createMongoAbility(rules));
  }
}
