import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

export interface MembershipEventBus {
  publish(eventName: string, payload: Record<string, unknown>): AsyncResult<void, AppError>;
}
