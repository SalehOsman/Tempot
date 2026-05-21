import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('settings-management module config', () => {
  it('should be active with settings navigation', () => {
    expect(config.name).toBe('settings-management');
    expect(config.isActive).toBe(true);
    expect(config.isCore).toBe(false);
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('settings:view');
  });
});
