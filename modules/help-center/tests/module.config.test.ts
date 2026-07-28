import { describe, expect, it } from 'vitest';
import config from '../module.config.js';

describe('help-center module config', () => {
  it('should be active with help navigation', () => {
    expect(config.name).toBe('help-center');
    expect(config.isActive).toBe(true);
    expect(config.isCore).toBe(false);
    expect(config.navigation?.mainMenu[0]?.callbackData).toBe('help:view');
  });

  it('should declare graceful AI support through approved packages', () => {
    expect(config.features.hasAI).toBe(true);
    expect(config.aiDegradationMode).toBe('graceful');
    expect(config.requires.packages).toContain('@tempot/ai-core');
  });
});
