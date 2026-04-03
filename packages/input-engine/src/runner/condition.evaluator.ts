import type { FieldCondition, FieldMetadata } from '../input-engine.types.js';

/**
 * Evaluate a single FieldCondition against the current formData.
 * Returns true if the condition is met, false otherwise.
 */
function evaluateSingle(condition: FieldCondition, formData: Record<string, unknown>): boolean {
  if (condition.fn) return condition.fn(formData);

  const fieldValue = formData[condition.dependsOn];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'notEquals':
      return fieldValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && (condition.value as unknown[]).includes(fieldValue);
    case 'gt':
      return (
        typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue > condition.value
      );
    case 'lt':
      return (
        typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue < condition.value
      );
    case 'custom':
      // If fn exists, it was already handled by the early return above
      return true;
    default:
      return true;
  }
}

/**
 * Evaluate all conditions for a field. All conditions must be met (AND logic).
 * Returns true if the field should be rendered (all conditions met or no conditions).
 */
export function shouldRenderField(
  metadata: FieldMetadata,
  formData: Record<string, unknown>,
): boolean {
  if (!metadata.conditions || metadata.conditions.length === 0) {
    return true;
  }
  return metadata.conditions.every((c) => evaluateSingle(c, formData));
}
