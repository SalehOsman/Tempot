import { z } from 'zod';
import { shouldRenderField } from './condition.evaluator.js';
import type { FormRunnerDeps, FormProgress } from './form.runner.js';
import { getFieldMetadata } from './field-metadata.util.js';

/** Parameters for navigateBack */
interface NavigateBackParams {
  currentIndex: number;
  fieldNames: string[];
  progress: FormProgress;
  schema: z.ZodObject<z.ZodRawShape>;
  deps: FormRunnerDeps;
}

/** Parameters for cleanConditionalFields */
interface CleanConditionalParams {
  startIndex: number;
  fieldNames: string[];
  progress: FormProgress;
  schema: z.ZodObject<z.ZodRawShape>;
  deps: FormRunnerDeps;
}

/** Remove conditional fields that are no longer visible after back navigation */
function cleanConditionalFields(params: CleanConditionalParams): void {
  const { startIndex, fieldNames, progress, schema, deps } = params;

  for (let i = startIndex; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i]!;
    const fieldSchema = schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      const idx = progress.completedFieldNames.indexOf(fieldName);
      if (idx !== -1) {
        progress.completedFieldNames.splice(idx, 1);
        delete progress.formData[fieldName];
        progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
        deps.logger.debug({ msg: 'Removed conditional field after back', fieldName });
      }
    }
  }
}

/** Navigate back to previous user-answered field, skipping condition-false fields */
export function navigateBack(params: NavigateBackParams): number {
  const { currentIndex, fieldNames, progress, schema, deps } = params;

  if (currentIndex === 0) return 0;

  let targetIndex = currentIndex - 1;
  while (targetIndex >= 0) {
    const targetField = fieldNames[targetIndex]!;
    const targetSchema = schema.shape[targetField] as z.ZodType;
    const targetMeta = getFieldMetadata(targetSchema);

    // Skip condition-false fields (D25)
    if (!shouldRenderField(targetMeta, progress.formData)) {
      targetIndex--;
      continue;
    }

    // Found the target — remove it from completed
    if (progress.completedFieldNames.includes(targetField)) {
      const idx = progress.completedFieldNames.indexOf(targetField);
      progress.completedFieldNames.splice(idx, 1);
      delete progress.formData[targetField];
      progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
    }

    break;
  }

  // Clean up conditional fields that became hidden after removing data
  cleanConditionalFields({
    startIndex: Math.max(0, targetIndex) + 1,
    fieldNames,
    progress,
    schema,
    deps,
  });

  return Math.max(0, targetIndex);
}
