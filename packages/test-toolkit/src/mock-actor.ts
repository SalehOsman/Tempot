import type { ActorIdentity } from '@tembot/shared-types';

export interface MockActorOptions {
  id?: string;
  type?: 'telegram_user' | 'operator' | 'system_worker';
  capabilities?: readonly string[];
  tenantId?: string;
}

/**
 * Creates a mock ActorIdentity for use in unit tests.
 */
export function createMockActor(options: MockActorOptions = {}): ActorIdentity {
  return {
    id: options.id ?? 'mock-actor-1',
    type: options.type ?? 'operator',
    capabilities: options.capabilities ?? ['*'], // Default to full capabilities unless specified
    tenantId: options.tenantId,
  };
}
