import { z } from 'zod';
import type { FieldMetadata } from '../input-engine.types.js';

/** Extract FieldMetadata from a Zod schema via globalRegistry */
export function getFieldMetadata(schema: z.ZodType): FieldMetadata {
  const meta = z.globalRegistry.get(schema);
  return (meta as Record<string, unknown> | undefined)?.['input-engine'] as FieldMetadata;
}
