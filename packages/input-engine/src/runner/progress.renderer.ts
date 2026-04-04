import type { FieldMetadata, TranslateFunction } from '../input-engine.types.js';
import { defaultT } from '../input-engine.types.js';
import { shouldRenderField } from './condition.evaluator.js';

/** Function type for field visibility evaluation */
type ShouldRenderFn = (metadata: FieldMetadata, formData: Record<string, unknown>) => boolean;

/** Bundled params for computeDynamicTotal to respect max-params */
interface DynamicTotalParams {
  fieldNames: string[];
  allMetadata: Map<string, FieldMetadata>;
  formData: Record<string, unknown>;
  shouldRenderFn?: ShouldRenderFn;
}

/** Compute dynamic total of visible fields given current formData */
export function computeDynamicTotal(params: DynamicTotalParams): number {
  const { fieldNames, allMetadata, formData, shouldRenderFn = shouldRenderField } = params;
  let count = 0;
  for (const fieldName of fieldNames) {
    const metadata = allMetadata.get(fieldName);
    if (!metadata) continue;
    if (shouldRenderFn(metadata, formData)) {
      count++;
    }
  }
  return count;
}

/** Render progress text using i18n */
export function renderProgress(
  current: number,
  total: number,
  t: TranslateFunction = defaultT,
): string {
  return t('input-engine.progress', { current, total });
}
