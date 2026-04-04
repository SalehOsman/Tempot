import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { navigateBack } from '../../src/runner/back-navigation.helper.js';
import type { FormRunnerDeps, FormProgress } from '../../src/runner/form.runner.js';

function createMockDeps(): FormRunnerDeps {
  return {
    registry: {} as FormRunnerDeps['registry'],
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    eventBus: {} as FormRunnerDeps['eventBus'],
    isEnabled: () => true,
    getActiveConversation: () => undefined,
    setActiveConversation: vi.fn(),
    userId: 'user-1',
    chatId: 123,
  };
}

function createProgress(overrides: Partial<FormProgress> = {}): FormProgress {
  return {
    fieldsCompleted: 0,
    totalFields: 3,
    formId: 'test-form',
    formData: {},
    completedFieldNames: [],
    partialSaveEnabled: false,
    storageKey: 'test-key',
    startTime: Date.now(),
    maxMilliseconds: 300_000,
    ...overrides,
  };
}

describe('navigateBack', () => {
  describe('C2 — stale formData in cleanConditionalFields', () => {
    it('cleans conditional field C when navigating back to B (C depends on B)', () => {
      // Schema: A (unconditional), B (unconditional), C (conditional on B='yes')
      // Bug: navigating back to B keeps B's value in formData, so C's condition
      // (B === 'yes') still evaluates as true and C is NOT cleaned.
      const fieldA = z.string();
      const fieldB = z.string();
      const fieldC = z.string();

      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      z.globalRegistry.add(fieldB, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'b' },
      });
      z.globalRegistry.add(fieldC, {
        'input-engine': {
          fieldType: 'ShortText',
          i18nKey: 'c',
          conditions: [{ dependsOn: 'B', operator: 'equals', value: 'yes' }],
        },
      });

      const schema = z.object({ A: fieldA, B: fieldB, C: fieldC });
      const deps = createMockDeps();

      const progress = createProgress({
        fieldsCompleted: 3,
        formData: { A: 'hello', B: 'yes', C: 'conditional-value' },
        completedFieldNames: ['A', 'B', 'C'],
      });

      // Navigate back from C (index 2) to B (index 1)
      const result = navigateBack({
        currentIndex: 2,
        fieldNames: ['A', 'B', 'C'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(1);

      // KEY ASSERTION: C should be removed from completedFieldNames because
      // B's value was temporarily deleted during cleanConditionalFields,
      // making C's condition (B === 'yes') fail.
      expect(progress.completedFieldNames).not.toContain('C');

      // C's formData should be cleaned up by cleanConditionalFields
      expect(progress.formData).not.toHaveProperty('C');

      // B's value should be preserved for previousValue support
      expect(progress.formData['B']).toBe('yes');
    });

    it('preserves unrelated conditional fields that remain valid', () => {
      // Schema: A, B, C (conditional on A='hello'), D (conditional on B='yes')
      // Navigate back to B — C depends on A (not B), so C stays. D depends on B, so D is cleaned.
      const fieldA = z.string();
      const fieldB = z.string();
      const fieldC = z.string();
      const fieldD = z.string();

      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      z.globalRegistry.add(fieldB, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'b' },
      });
      z.globalRegistry.add(fieldC, {
        'input-engine': {
          fieldType: 'ShortText',
          i18nKey: 'c',
          conditions: [{ dependsOn: 'A', operator: 'equals', value: 'hello' }],
        },
      });
      z.globalRegistry.add(fieldD, {
        'input-engine': {
          fieldType: 'ShortText',
          i18nKey: 'd',
          conditions: [{ dependsOn: 'B', operator: 'equals', value: 'yes' }],
        },
      });

      const schema = z.object({ A: fieldA, B: fieldB, C: fieldC, D: fieldD });
      const deps = createMockDeps();

      const progress = createProgress({
        totalFields: 4,
        fieldsCompleted: 4,
        formData: { A: 'hello', B: 'yes', C: 'c-val', D: 'd-val' },
        completedFieldNames: ['A', 'B', 'C', 'D'],
      });

      // Navigate back from D (index 3) to C (index 2)
      // cleanConditionalFields runs for index 3 (D).
      // C is the target. C depends on A='hello'. A is still in formData.
      // But wait — the target is C, not B. Let me navigate to B instead.

      // Navigate back from D (index 3) — target is C at index 2 (condition met: A='hello')
      const result = navigateBack({
        currentIndex: 3,
        fieldNames: ['A', 'B', 'C', 'D'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(2);

      // D depends on B='yes'. C's value was temporarily deleted during cleanup.
      // D depends on B, NOT on C — so D should still be valid.
      // A is untouched, B is untouched, C is temporarily deleted then restored.
      // D's condition (B='yes') still holds → D should remain.
      expect(progress.completedFieldNames).toContain('D');
      expect(progress.formData).toHaveProperty('D');

      // C's value should be preserved for previousValue support
      expect(progress.formData['C']).toBe('c-val');
    });

    it('restores target field value after cleanConditionalFields for previousValue support', () => {
      const fieldA = z.string();
      const fieldB = z.string();

      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      z.globalRegistry.add(fieldB, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'b' },
      });

      const schema = z.object({ A: fieldA, B: fieldB });
      const deps = createMockDeps();

      const progress = createProgress({
        fieldsCompleted: 2,
        totalFields: 2,
        formData: { A: 'hello', B: 'world' },
        completedFieldNames: ['A', 'B'],
      });

      // Navigate back from B (index 1) to A (index 0)
      const result = navigateBack({
        currentIndex: 1,
        fieldNames: ['A', 'B'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(0);

      // A's value should be preserved in formData for previousValue support
      expect(progress.formData['A']).toBe('hello');
    });
  });

  describe('basic navigation', () => {
    it('returns 0 when currentIndex is 0', () => {
      const fieldA = z.string();
      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      const schema = z.object({ A: fieldA });
      const deps = createMockDeps();
      const progress = createProgress();

      const result = navigateBack({
        currentIndex: 0,
        fieldNames: ['A'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(0);
    });

    it('navigates back to previous field and removes from completedFieldNames', () => {
      const fieldA = z.string();
      const fieldB = z.string();

      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      z.globalRegistry.add(fieldB, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'b' },
      });

      const schema = z.object({ A: fieldA, B: fieldB });
      const deps = createMockDeps();

      const progress = createProgress({
        fieldsCompleted: 2,
        totalFields: 2,
        formData: { A: 'val-a', B: 'val-b' },
        completedFieldNames: ['A', 'B'],
      });

      const result = navigateBack({
        currentIndex: 1,
        fieldNames: ['A', 'B'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(0);
      expect(progress.completedFieldNames).not.toContain('A');
      expect(progress.fieldsCompleted).toBe(1);
    });

    it('skips condition-false fields during back navigation', () => {
      const fieldA = z.string();
      const fieldB = z.string();
      const fieldC = z.string();

      z.globalRegistry.add(fieldA, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'a' },
      });
      z.globalRegistry.add(fieldB, {
        'input-engine': {
          fieldType: 'ShortText',
          i18nKey: 'b',
          conditions: [{ dependsOn: 'A', operator: 'equals', value: 'nope' }],
        },
      });
      z.globalRegistry.add(fieldC, {
        'input-engine': { fieldType: 'ShortText', i18nKey: 'c' },
      });

      const schema = z.object({ A: fieldA, B: fieldB, C: fieldC });
      const deps = createMockDeps();

      const progress = createProgress({
        fieldsCompleted: 2,
        formData: { A: 'yes', C: 'val-c' },
        completedFieldNames: ['A', 'C'],
      });

      // Navigate back from C (index 2) — B's condition fails (A != 'nope'),
      // so it should skip B and land on A (index 0)
      const result = navigateBack({
        currentIndex: 2,
        fieldNames: ['A', 'B', 'C'],
        progress,
        schema,
        deps,
      });

      expect(result).toBe(0);
    });
  });
});
