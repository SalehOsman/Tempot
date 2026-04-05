import { describe, it, expect } from 'vitest';
import { validateFrontmatter } from '../../scripts/validate-frontmatter.js';

/** Remove a key from an object without triggering unused-var lint */
function omit<T extends Record<string, unknown>>(obj: T, key: keyof T): Partial<T> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe('validateFrontmatter', () => {
  const validFrontmatter = {
    title: 'Getting Started',
    description: 'Learn how to set up Tempot',
    tags: ['tutorial', 'setup'],
    audience: ['bot-developer'] as const,
    contentType: 'developer-docs' as const,
  };

  it('returns ok for valid frontmatter with all required fields', () => {
    const result = validateFrontmatter(validFrontmatter);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(validFrontmatter);
    }
  });

  it('returns err when title is missing', () => {
    const result = validateFrontmatter(omit(validFrontmatter, 'title'));
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
    }
  });

  it('returns err when description is missing', () => {
    const result = validateFrontmatter(omit(validFrontmatter, 'description'));
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
    }
  });

  it('returns err when tags is missing', () => {
    const result = validateFrontmatter(omit(validFrontmatter, 'tags'));
    expect(result.isErr()).toBe(true);
  });

  it('returns err when tags is empty array', () => {
    const result = validateFrontmatter({ ...validFrontmatter, tags: [] });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
    }
  });

  it('returns err when audience is missing', () => {
    const result = validateFrontmatter(omit(validFrontmatter, 'audience'));
    expect(result.isErr()).toBe(true);
  });

  it('returns err for invalid audience value', () => {
    const result = validateFrontmatter({
      ...validFrontmatter,
      audience: ['admin'] as unknown as typeof validFrontmatter.audience,
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
    }
  });

  it('returns err for invalid contentType', () => {
    const result = validateFrontmatter({
      ...validFrontmatter,
      contentType: 'blog-post' as unknown as typeof validFrontmatter.contentType,
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
    }
  });

  it('accepts optional package field when present', () => {
    const result = validateFrontmatter({
      ...validFrontmatter,
      package: 'shared',
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.package).toBe('shared');
    }
  });

  it('accepts optional difficulty field when present', () => {
    const result = validateFrontmatter({
      ...validFrontmatter,
      difficulty: 'beginner' as const,
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.difficulty).toBe('beginner');
    }
  });

  it('returns ok with all optional fields present', () => {
    const full = {
      ...validFrontmatter,
      package: 'ai-core',
      difficulty: 'advanced' as const,
    };
    const result = validateFrontmatter(full);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(full);
    }
  });

  it('returns err when contentType is missing', () => {
    const result = validateFrontmatter(omit(validFrontmatter, 'contentType'));
    expect(result.isErr()).toBe(true);
  });

  it('accepts all valid audience values', () => {
    const result = validateFrontmatter({
      ...validFrontmatter,
      audience: ['package-developer', 'bot-developer', 'operator', 'end-user'],
    });
    expect(result.isOk()).toBe(true);
  });
});
