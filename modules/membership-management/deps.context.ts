import type { ModuleDeps } from './index.js';
import type { MembershipRequestDraftStore } from './services/membership-request-draft.store.js';
import type { MembershipRequestService } from './services/membership-request.service.js';
import type { MembershipAdminNotifier } from './types/module-deps.types.js';

export interface MembershipManagementDeps extends Pick<ModuleDeps, 'authorization' | 'i18n'> {
  adminNotifier: MembershipAdminNotifier;
  membershipRequests: Pick<
    MembershipRequestService,
    'submit' | 'listPending' | 'getById' | 'approve' | 'reject'
  >;
  requestDrafts: MembershipRequestDraftStore;
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
