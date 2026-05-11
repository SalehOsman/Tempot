import { describe, it, expect } from 'vitest';
import {
  canTransition,
  checkCompletenessForReview,
  getTransitionPolicy,
  VALID_TRANSITIONS,
} from '../../contracts/lifecycle-transitions.js';
import { TemplateStatus } from '../../types/template.types.js';
import type { Template } from '../../types/template.types.js';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tmpl-1',
    name: 'Test Template',
    description: 'A test template',
    slug: 'test-template',
    status: TemplateStatus.DRAFT,
    content: {
      commands: [{ name: 'start', description: 'Start command' }],
      messages: [{ key: 'welcome', defaultText: { ar: 'مرحبا' } }],
    },
    categoryId: 'cat-1',
    authorId: 'user-1',
    clonedFrom: null,
    language: 'ar',
    usageCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    currentVersion: null,
    isOfficial: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

describe('canTransition', () => {
  it('allows DRAFT -> REVIEW', () => {
    expect(canTransition(TemplateStatus.DRAFT, TemplateStatus.REVIEW)).toBe(true);
  });

  it('allows REVIEW -> PUBLISHED', () => {
    expect(canTransition(TemplateStatus.REVIEW, TemplateStatus.PUBLISHED)).toBe(true);
  });

  it('allows REVIEW -> DRAFT (rejection)', () => {
    expect(canTransition(TemplateStatus.REVIEW, TemplateStatus.DRAFT)).toBe(true);
  });

  it('allows PUBLISHED -> ARCHIVED', () => {
    expect(canTransition(TemplateStatus.PUBLISHED, TemplateStatus.ARCHIVED)).toBe(true);
  });

  it('allows ARCHIVED -> DRAFT (reactivation)', () => {
    expect(canTransition(TemplateStatus.ARCHIVED, TemplateStatus.DRAFT)).toBe(true);
  });

  it('rejects DRAFT -> PUBLISHED (skipping review)', () => {
    expect(canTransition(TemplateStatus.DRAFT, TemplateStatus.PUBLISHED)).toBe(false);
  });

  it('rejects DRAFT -> ARCHIVED', () => {
    expect(canTransition(TemplateStatus.DRAFT, TemplateStatus.ARCHIVED)).toBe(false);
  });

  it('rejects PUBLISHED -> DRAFT', () => {
    expect(canTransition(TemplateStatus.PUBLISHED, TemplateStatus.DRAFT)).toBe(false);
  });

  it('rejects PUBLISHED -> REVIEW', () => {
    expect(canTransition(TemplateStatus.PUBLISHED, TemplateStatus.REVIEW)).toBe(false);
  });

  it('rejects ARCHIVED -> PUBLISHED', () => {
    expect(canTransition(TemplateStatus.ARCHIVED, TemplateStatus.PUBLISHED)).toBe(false);
  });

  it('rejects same-state transition', () => {
    expect(canTransition(TemplateStatus.DRAFT, TemplateStatus.DRAFT)).toBe(false);
  });
});

describe('VALID_TRANSITIONS', () => {
  it('covers all 4 states', () => {
    const states = Object.values(TemplateStatus);
    for (const state of states) {
      expect(VALID_TRANSITIONS[state]).toBeDefined();
    }
  });
});

describe('checkCompletenessForReview', () => {
  it('allows complete template', () => {
    const template = makeTemplate();
    const result = checkCompletenessForReview(template);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects template without name', () => {
    const template = makeTemplate({ name: '' });
    const result = checkCompletenessForReview(template);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('template.error.missing_name');
  });

  it('rejects template without description', () => {
    const template = makeTemplate({ description: '' });
    const result = checkCompletenessForReview(template);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('template.error.missing_description');
  });

  it('rejects template without category', () => {
    const template = makeTemplate({ categoryId: null });
    const result = checkCompletenessForReview(template);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('template.error.missing_category');
  });

  it('rejects template without commands', () => {
    const template = makeTemplate({
      content: { commands: [], messages: [{ key: 'x', defaultText: { ar: 'x' } }] },
    });
    const result = checkCompletenessForReview(template);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('template.error.missing_commands');
  });
});

describe('getTransitionPolicy', () => {
  it('returns policy for DRAFT -> REVIEW', () => {
    const policy = getTransitionPolicy(TemplateStatus.DRAFT, TemplateStatus.REVIEW);
    expect(policy).toBeDefined();
    expect(policy?.requiredRole).toBe('USER');
    expect(policy?.ownerOnly).toBe(true);
    expect(policy?.requiresReason).toBe(false);
  });

  it('returns policy for REVIEW -> PUBLISHED (admin required)', () => {
    const policy = getTransitionPolicy(TemplateStatus.REVIEW, TemplateStatus.PUBLISHED);
    expect(policy).toBeDefined();
    expect(policy?.requiredRole).toBe('ADMIN');
    expect(policy?.ownerOnly).toBe(false);
  });

  it('returns policy for REVIEW -> DRAFT (rejection requires reason)', () => {
    const policy = getTransitionPolicy(TemplateStatus.REVIEW, TemplateStatus.DRAFT);
    expect(policy).toBeDefined();
    expect(policy?.requiresReason).toBe(true);
  });

  it('returns undefined for invalid transition', () => {
    const policy = getTransitionPolicy(TemplateStatus.DRAFT, TemplateStatus.PUBLISHED);
    expect(policy).toBeUndefined();
  });
});
