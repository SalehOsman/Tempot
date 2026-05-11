import { describe, it, expect } from 'vitest';
import {
  templateContentSchema,
  createTemplateSchema,
  templateCommandDefSchema,
  templateMessageDefSchema,
} from '../../contracts/template-content.schema.js';

describe('templateCommandDefSchema', () => {
  it('accepts valid command', () => {
    const result = templateCommandDefSchema.safeParse({
      name: 'order',
      description: 'Place an order',
    });
    expect(result.success).toBe(true);
  });

  it('accepts command with handler', () => {
    const result = templateCommandDefSchema.safeParse({
      name: 'start',
      description: 'Start the bot',
      handler: 'startHandler',
    });
    expect(result.success).toBe(true);
  });

  it('rejects command with uppercase name', () => {
    const result = templateCommandDefSchema.safeParse({
      name: 'Order',
      description: 'Place an order',
    });
    expect(result.success).toBe(false);
  });

  it('rejects command with empty name', () => {
    const result = templateCommandDefSchema.safeParse({
      name: '',
      description: 'desc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects command with name exceeding 64 chars', () => {
    const result = templateCommandDefSchema.safeParse({
      name: 'a'.repeat(65),
      description: 'desc',
    });
    expect(result.success).toBe(false);
  });
});

describe('templateMessageDefSchema', () => {
  it('accepts valid message with one language', () => {
    const result = templateMessageDefSchema.safeParse({
      key: 'welcome',
      defaultText: { ar: 'مرحبا بك' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts message with multiple languages', () => {
    const result = templateMessageDefSchema.safeParse({
      key: 'greeting',
      defaultText: { ar: 'مرحبا', en: 'Hello' },
      placeholders: ['name'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects message with empty defaultText', () => {
    const result = templateMessageDefSchema.safeParse({
      key: 'error',
      defaultText: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('templateContentSchema', () => {
  it('accepts minimal valid content', () => {
    const result = templateContentSchema.safeParse({
      commands: [{ name: 'start', description: 'Start' }],
      messages: [{ key: 'welcome', defaultText: { ar: 'مرحبا' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts full content with all optional fields', () => {
    const result = templateContentSchema.safeParse({
      commands: [{ name: 'help', description: 'Help command' }],
      messages: [{ key: 'help_text', defaultText: { en: 'Help' } }],
      inputForms: [
        {
          name: 'registration',
          steps: [{ field: 'name', type: 'text', label: 'Your name' }],
        },
      ],
      permissions: [{ action: 'read', subject: 'order', minRole: 'USER' }],
      settings: [
        { key: 'timeout', type: 'number', defaultValue: 30, description: 'Timeout in seconds' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects content without commands', () => {
    const result = templateContentSchema.safeParse({
      commands: [],
      messages: [{ key: 'x', defaultText: { ar: 'x' } }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects content without messages', () => {
    const result = templateContentSchema.safeParse({
      commands: [{ name: 'x', description: 'x' }],
      messages: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('createTemplateSchema', () => {
  it('accepts valid minimal input', () => {
    const result = createTemplateSchema.safeParse({
      name: 'My Template',
      description: 'A great template',
      language: 'ar',
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with all optional fields', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Full Template',
      description: 'With everything',
      categoryId: 'cat-123',
      language: 'en',
      tags: ['bot', 'ecommerce'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Test',
      description: 'Test',
      language: 'fr',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createTemplateSchema.safeParse({
      name: '',
      description: 'Test',
      language: 'ar',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too many tags', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Test',
      description: 'Test',
      language: 'ar',
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });
});
