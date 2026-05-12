import { describe, expect, it } from 'vitest';
import {
  canTransition,
  getTransitionPolicy,
  requiresTransitionReason,
  VALID_BOT_TRANSITIONS,
} from '../../contracts/lifecycle-transitions.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

describe('bot lifecycle transitions', () => {
  it('allows the primary activation path', () => {
    expect(canTransition(BotLifecycleStatus.DRAFT, BotLifecycleStatus.CONFIGURED)).toBe(true);
    expect(canTransition(BotLifecycleStatus.CONFIGURED, BotLifecycleStatus.ACTIVE)).toBe(true);
  });

  it('allows pause, resume, maintenance, and archive transitions from valid states', () => {
    expect(canTransition(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.PAUSED)).toBe(true);
    expect(canTransition(BotLifecycleStatus.PAUSED, BotLifecycleStatus.ACTIVE)).toBe(true);
    expect(canTransition(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.MAINTENANCE)).toBe(true);
    expect(canTransition(BotLifecycleStatus.MAINTENANCE, BotLifecycleStatus.ACTIVE)).toBe(true);
    expect(canTransition(BotLifecycleStatus.CONFIGURED, BotLifecycleStatus.ARCHIVED)).toBe(true);
  });

  it('rejects invalid or unsafe lifecycle jumps', () => {
    expect(canTransition(BotLifecycleStatus.DRAFT, BotLifecycleStatus.ACTIVE)).toBe(false);
    expect(canTransition(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.CONFIGURED)).toBe(false);
    expect(canTransition(BotLifecycleStatus.ARCHIVED, BotLifecycleStatus.ACTIVE)).toBe(false);
    expect(canTransition(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.ACTIVE)).toBe(false);
  });

  it('requires reasons for pause, maintenance, and archive transitions', () => {
    expect(requiresTransitionReason(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.PAUSED)).toBe(
      true,
    );
    expect(
      requiresTransitionReason(BotLifecycleStatus.PAUSED, BotLifecycleStatus.MAINTENANCE),
    ).toBe(true);
    expect(requiresTransitionReason(BotLifecycleStatus.ACTIVE, BotLifecycleStatus.ARCHIVED)).toBe(
      true,
    );
    expect(requiresTransitionReason(BotLifecycleStatus.CONFIGURED, BotLifecycleStatus.ACTIVE)).toBe(
      false,
    );
  });

  it('returns policy only for valid transitions', () => {
    expect(getTransitionPolicy(BotLifecycleStatus.DRAFT, BotLifecycleStatus.CONFIGURED)).toEqual({
      requiredRole: 'ADMIN',
      requiresReason: false,
    });
    expect(
      getTransitionPolicy(BotLifecycleStatus.DRAFT, BotLifecycleStatus.ACTIVE),
    ).toBeUndefined();
  });

  it('defines transition entries for every lifecycle state', () => {
    for (const status of Object.values(BotLifecycleStatus)) {
      expect(VALID_BOT_TRANSITIONS[status]).toBeDefined();
    }
  });
});
