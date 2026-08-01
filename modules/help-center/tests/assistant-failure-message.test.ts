import { describe, expect, it } from 'vitest';
import { HelpAssistantResponseService } from '../services/help-assistant-response.service.js';

describe('HelpAssistantResponseService failure messages', () => {
  it('renders quota guidance without exposing provider error codes', () => {
    const service = new HelpAssistantResponseService();

    const message = service.renderFailure(
      (key, options) => (options ? `${key}:${JSON.stringify(options)}` : key),
      'ai-core.provider.quota_exceeded',
    );

    expect(message).toBe('help-center.assistant.degraded_quota');
  });
});
