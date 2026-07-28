import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('knowledge-management module config', () => {
  it('is a super-admin AI operations module', () => {
    expect(config.name).toBe('knowledge-management');
    expect(config.requiredRole).toBe('SUPER_ADMIN');
    expect(config.features.hasAI).toBe(true);
    expect(config.aiDegradationMode).toBe('graceful');
    expect(config.requires.packages).toContain('@tempot/ai-core');
  });

  it('contributes one governed main-menu entry', () => {
    const item = config.navigation?.mainMenu[0];
    expect(item?.callbackData).toBe('knowledge:view');
    expect(item?.requiredRole).toBe('SUPER_ADMIN');
    expect(item?.requiredAbility).toBe('manage.knowledge');
  });
});
