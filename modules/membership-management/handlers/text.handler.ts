import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import type { ModuleAuthorizationPolicy } from '../index.js';
import { handleMembershipText as processTextInput } from './membership-request-flow.handler.js';

const noopNext: NextFunction = () => Promise.resolve();

const TEXT_POLICY: ModuleAuthorizationPolicy = {
  module: 'membership-management',
  classification: 'bootstrap',
  action: 'create',
  subject: 'membership-request',
};

export async function handleMembershipTextGuarded(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  if (!(await getDeps().authorization.enforce(ctx, TEXT_POLICY))) return;
  await processTextInput(ctx, next);
}
