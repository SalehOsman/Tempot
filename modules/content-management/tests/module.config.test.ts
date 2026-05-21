import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('content-management module config', () => {
  it('should be active with messages navigation', () => {
    expect(config.name).toBe('content-management');
    expect(config.isActive).toBe(true);
    expect(config.isCore).toBe(false);
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('messages:view');
  });
});
