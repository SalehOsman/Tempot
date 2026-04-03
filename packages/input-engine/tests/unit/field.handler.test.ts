import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldType } from '../../src/input-engine.types.js';

function createMockHandler(fieldType: FieldType): FieldHandler {
  return {
    fieldType,
    render: vi.fn().mockResolvedValue(ok(undefined)),
    parseResponse: vi.fn().mockReturnValue(ok('parsed')),
    validate: vi.fn().mockReturnValue(ok('valid')),
  };
}

describe('FieldHandlerRegistry', () => {
  let registry: FieldHandlerRegistry;

  beforeEach(() => {
    registry = new FieldHandlerRegistry();
  });

  it('registers and retrieves a handler', () => {
    const handler = createMockHandler('ShortText');
    registry.register(handler);
    expect(registry.get('ShortText')).toBe(handler);
  });

  it('returns undefined for unregistered type', () => {
    expect(registry.get('ShortText')).toBeUndefined();
  });

  it('has() returns true for registered type', () => {
    registry.register(createMockHandler('Email'));
    expect(registry.has('Email')).toBe(true);
    expect(registry.has('Phone')).toBe(false);
  });

  it('getRegisteredTypes() returns all registered types', () => {
    registry.register(createMockHandler('ShortText'));
    registry.register(createMockHandler('Email'));
    registry.register(createMockHandler('Phone'));
    expect(registry.getRegisteredTypes()).toEqual(['ShortText', 'Email', 'Phone']);
  });

  it('overwrites existing handler for same type', () => {
    const handler1 = createMockHandler('ShortText');
    const handler2 = createMockHandler('ShortText');
    registry.register(handler1);
    registry.register(handler2);
    expect(registry.get('ShortText')).toBe(handler2);
  });
});
