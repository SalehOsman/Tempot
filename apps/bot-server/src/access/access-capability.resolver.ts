import type { Context } from 'grammy';
import type { AccessCapability } from './access.types.js';

const ADMIN_CAPABILITIES = new Set(['membership', 'stats', 'users']);

const REQUIRED_ABILITY_BY_CAPABILITY: Record<string, string> = {
  help: 'read.help',
  messages: 'read.content',
  notifications: 'read.notifications',
  profile: 'read.profile',
  settings: 'read.settings',
  stats: 'read.audit',
  users: 'manage.users',
};

export function capabilityFromContext(ctx: Context): AccessCapability | null {
  const command = commandFromText(ctx.message?.text);
  if (command !== null) return commandCapability(command);
  const callbackData = ctx.callbackQuery?.data;
  if (callbackData !== undefined) return callbackCapability(callbackData);
  return null;
}

function commandFromText(text: string | undefined): string | null {
  if (text === undefined || !text.startsWith('/')) return null;
  const firstToken = text.split(/\s+/, 1)[0];
  if (firstToken === undefined) return null;
  return firstToken.replace(/^\//, '').split('@', 1)[0] ?? null;
}

function commandCapability(command: string): AccessCapability {
  if (command === 'start') return { id: 'command.start', classification: 'bootstrap' };
  if (command === 'join') return { id: 'command.join', classification: 'bootstrap' };
  if (command === 'help') {
    return {
      id: 'command.help',
      classification: 'public',
      requiredAbility: requiredAbilityForCapability(command),
    };
  }
  return {
    id: `command.${command}`,
    classification: ADMIN_CAPABILITIES.has(command) ? 'admin' : 'protected',
    requiredAbility: requiredAbilityForCapability(command),
  };
}

function callbackCapability(data: string): AccessCapability {
  const namespace = data.split(':', 1)[0] ?? 'callback';
  if (data === 'membership:request') {
    return { id: 'callback.membership.request', classification: 'bootstrap' };
  }
  if (namespace === 'membership') {
    return {
      id: 'callback.membership',
      classification: 'admin',
      requiredAbility: 'manage.membership-request',
    };
  }
  return {
    id: `callback.${namespace}`,
    classification: ADMIN_CAPABILITIES.has(namespace) ? 'admin' : 'protected',
    requiredAbility: requiredAbilityForCapability(namespace),
  };
}

function requiredAbilityForCapability(capability: string): string | undefined {
  return REQUIRED_ABILITY_BY_CAPABILITY[capability];
}
