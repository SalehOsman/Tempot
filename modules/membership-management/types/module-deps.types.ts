import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { MembershipRequest } from './membership-request.types.js';

export interface MembershipEventBus {
  publish(eventName: string, payload: Record<string, unknown>): AsyncResult<void, AppError>;
}

export interface MembershipAdminNotifier {
  notifySubmitted(request: MembershipRequest): Promise<void>;
}
