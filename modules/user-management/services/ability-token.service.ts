import type { AnyAbility, RawRuleOf } from '@casl/ability';
import type { Context } from 'grammy';

export function abilityTokensFromContext(ctx: Context): readonly string[] {
  const ability = (ctx as unknown as { ability?: AnyAbility }).ability;
  if (ability === undefined) return [];

  return ability.rules.flatMap((rule: RawRuleOf<AnyAbility>) => {
    const action = singleAbilityPart(rule.action);
    const subject = singleAbilityPart(rule.subject);
    if (action === null || subject === null) return [];
    return [`${action}.${subject}`];
  });
}

function singleAbilityPart(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === 'string') return value[0];
  return null;
}
