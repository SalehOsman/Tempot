import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('notification-center module config', () => {
  it('should be active with notifications navigation', () => {
    expect(config.name).toBe('notification-center');
    expect(config.isActive).toBe(true);
    expect(config.isCore).toBe(false);
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('notifications:view');
  });
});
