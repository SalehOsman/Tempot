import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('audit-viewer module config', () => {
  it('should be active with stats navigation', () => {
    expect(config.name).toBe('audit-viewer');
    expect(config.isActive).toBe(true);
    expect(config.isCore).toBe(false);
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('stats:view');
  });
});
