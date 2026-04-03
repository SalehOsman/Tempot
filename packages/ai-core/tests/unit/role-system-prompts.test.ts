import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from '../../src/prompts/role-system-prompts.js';

describe('getSystemPrompt', () => {
  it('returns super_admin prompt key for super_admin role', () => {
    expect(getSystemPrompt('super_admin', 'ar')).toBe('ai-core.system_prompt.super_admin');
  });

  it('returns admin prompt key for admin role', () => {
    expect(getSystemPrompt('admin', 'ar')).toBe('ai-core.system_prompt.admin');
  });

  it('returns user prompt key for user role', () => {
    expect(getSystemPrompt('user', 'en')).toBe('ai-core.system_prompt.user');
  });

  it('defaults to user prompt key for unknown role', () => {
    expect(getSystemPrompt('unknown_role', 'ar')).toBe('ai-core.system_prompt.user');
  });
});
