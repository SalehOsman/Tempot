import type { ModuleAuthorizationPolicy } from '../index.js';

export function resolveCallbackAuthorizationPolicy(action?: string): ModuleAuthorizationPolicy {
  if (action === 'create') return createPolicy('create', 'bot');
  if (action === 'settings') return createPolicy('read', 'settings-profile');
  if (action === 'modules') return createPolicy('read', 'module-enablement');
  if (isLifecycleMutation(action)) return createPolicy('manage', 'bot');
  return createPolicy('read', 'bot');
}

function isLifecycleMutation(action?: string): boolean {
  return (
    action === 'lifecycle-transition' ||
    action === 'lifecycle-reason' ||
    action === 'lifecycle-archive-confirm' ||
    action === 'lifecycle-archive-start' ||
    action === 'archive'
  );
}

function createPolicy(action: string, subject: string): ModuleAuthorizationPolicy {
  return {
    module: 'bot-management',
    classification: 'protected',
    action,
    subject,
  };
}
