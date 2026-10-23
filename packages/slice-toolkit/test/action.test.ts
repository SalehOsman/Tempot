import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ok } from '@tembot/shared-types';
import { defineAction } from '../src/action.js';

describe('defineAction Specification', () => {
  const schema = z.object({
    username: z.string().min(3),
    age: z.number().int().positive(),
  });

  const testAction = defineAction({
    inputSchema: schema,
    requiredCapabilities: ['user:create'],
    async handler(input, _ctx) {
      return ok({ success: true, user: input.username });
    },
  });

  it('rejects invalid inputs with ValidationError (Fail-Fast)', async () => {
    const res = await testAction({ username: 'ab', age: -5 });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('enforces capability checks and returns ForbiddenError when capability is missing', async () => {
    const res = await testAction(
      { username: 'valid_user', age: 25 },
      { actor: { actorId: 'user_123', actorType: 'user', capabilities: ['other:cap'] } }
    );
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error.code).toBe('FORBIDDEN');
    }
  });

  it('allows execution when actor possesses required capability', async () => {
    const res = await testAction(
      { username: 'valid_user', age: 25 },
      { actor: { actorId: 'admin_1', actorType: 'admin', capabilities: ['user:create'] } }
    );
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ success: true, user: 'valid_user' });
    }
  });

  it('allows execution for superadmin wildcard capability "*"', async () => {
    const res = await testAction(
      { username: 'super_user', age: 30 },
      { actor: { actorId: 'root', actorType: 'admin', capabilities: ['*'] } }
    );
    expect(res.isOk()).toBe(true);
  });
});
