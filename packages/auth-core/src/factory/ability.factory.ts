import { AnyAbility, createMongoAbility } from '@casl/ability';
import { SessionUser } from '../contracts/session-user';

export type AbilityDefinition = (user: SessionUser) => AnyAbility;

export class AbilityFactory {
  static build(user: SessionUser, definitions: AbilityDefinition[]): AnyAbility {
    const rules = definitions.flatMap((def) => def(user).rules);
    return createMongoAbility(rules);
  }
}
