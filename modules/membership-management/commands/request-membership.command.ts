import type { Context } from 'grammy';
import { startMembershipRequestFlow } from '../handlers/membership-request-flow.handler.js';

export async function requestMembershipCommand(ctx: Context): Promise<void> {
  await startMembershipRequestFlow(ctx);
}
