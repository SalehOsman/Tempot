import type { ModuleDeps } from './index.js';
import type { MembershipRequestService } from './services/membership-request.service.js';

export interface MembershipManagementDeps extends Pick<ModuleDeps, 'i18n'> {
  membershipRequests: Pick<
    MembershipRequestService,
    'submit' | 'listPending' | 'getById' | 'approve' | 'reject'
  >;
}

let deps: MembershipManagementDeps | null = null;

export function registerDeps(value: MembershipManagementDeps): void {
  deps = value;
}

export function getDeps(): MembershipManagementDeps {
  if (deps === null) {
    throw new Error('[membership-management] getDeps() called before registerDeps()');
  }
  return deps;
}
