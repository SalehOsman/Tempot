import type { ModuleAuthorizationPolicy } from '../index.js';

export function resolveCallbackAuthorizationPolicy(action: string): ModuleAuthorizationPolicy {
  if (action === 'toggle') {
    return createPolicy('update', 'notifications');
  }
  if (action === 'test') {
    return createPolicy('create', 'notification-test');
  }
  return createPolicy('read', 'notifications');
}

function createPolicy(action: string, subject: string): ModuleAuthorizationPolicy {
  return {
    module: 'notification-center',
    classification: 'protected',
    action,
    subject,
  };
}
