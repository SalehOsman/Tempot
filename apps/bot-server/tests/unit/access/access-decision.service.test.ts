import { describe, expect, it } from 'vitest';
import { decideAccess } from '../../../src/access/access-decision.service.js';
import type { AccessActor, AccessCapability } from '../../../src/access/access.types.js';

const bootstrapCapability: AccessCapability = {
  id: 'membership.start',
  classification: 'bootstrap',
};

const publicCapability: AccessCapability = {
  id: 'help.public',
  classification: 'public',
};

const protectedCapability: AccessCapability = {
  id: 'settings.open',
  classification: 'protected',
  requiredAbility: 'read.settings',
};

const adminCapability: AccessCapability = {
  id: 'membership.review',
  classification: 'admin',
  requiredAbility: 'manage.membership-request',
};

const unknownActor: AccessActor = {
  state: 'UNKNOWN',
  abilities: [],
  resolutionStatus: 'resolved',
};

const pendingActor: AccessActor = {
  state: 'PENDING',
  abilities: [],
  resolutionStatus: 'resolved',
};

const memberActor: AccessActor = {
  state: 'MEMBER',
  abilities: ['read.settings'],
  resolutionStatus: 'resolved',
};

const adminActor: AccessActor = {
  state: 'ADMIN',
  abilities: ['manage.membership-request'],
  resolutionStatus: 'resolved',
};

describe('decideAccess', () => {
  it('should allow bootstrap capabilities for unknown actors in private mode', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: unknownActor,
      capability: bootstrapCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(true);
      expect(result.value.reason).toBe('bootstrap_allowed');
    }
  });

  it('should deny protected capabilities for unknown actors in private mode', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: unknownActor,
      capability: protectedCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false);
      expect(result.value.reason).toBe('profile_not_found');
    }
  });

  it('should deny public capabilities for unknown actors in private mode', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: unknownActor,
      capability: publicCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false);
      expect(result.value.reason).toBe('capability_not_public');
    }
  });

  it('should allow public capabilities for unknown actors in public mode', () => {
    const result = decideAccess({
      accessMode: 'public',
      actor: unknownActor,
      capability: publicCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(true);
      expect(result.value.reason).toBe('public_allowed');
    }
  });

  it('should deny protected capabilities for pending actors', () => {
    const result = decideAccess({
      accessMode: 'public',
      actor: pendingActor,
      capability: protectedCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false);
      expect(result.value.reason).toBe('membership_pending');
    }
  });

  it('should allow member capabilities when actor has the required ability', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: memberActor,
      capability: protectedCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(true);
      expect(result.value.reason).toBe('allowed');
    }
  });

  it('should deny member capabilities when actor is missing the required ability', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: { ...memberActor, abilities: [] },
      capability: protectedCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false);
      expect(result.value.reason).toBe('missing_ability');
    }
  });

  it('should allow admin capabilities when actor has the required ability', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: adminActor,
      capability: adminCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(true);
      expect(result.value.reason).toBe('allowed');
    }
  });

  it('should allow any required capability when actor has manage all', () => {
    const result = decideAccess({
      accessMode: 'private',
      actor: { ...adminActor, abilities: ['manage.all'] },
      capability: adminCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(true);
      expect(result.value.reason).toBe('allowed');
    }
  });

  it('should deny every non-bootstrap capability when actor resolution failed', () => {
    const result = decideAccess({
      accessMode: 'public',
      actor: { ...unknownActor, resolutionStatus: 'failed' },
      capability: publicCapability,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false);
      expect(result.value.reason).toBe('actor_resolution_failed');
    }
  });
});
