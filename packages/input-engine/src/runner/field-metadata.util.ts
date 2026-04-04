import { z } from 'zod';
import type { FieldMetadata } from '../input-engine.types.js';

/** Extract FieldMetadata from a Zod schema via globalRegistry */
export function getFieldMetadata(schema: z.ZodType): FieldMetadata | undefined {
  const meta = z.globalRegistry.get(schema);
  return (meta as Record<string, unknown> | undefined)?.['input-engine'] as
    | FieldMetadata
    | undefined;
}

/** Build a Map of fieldName → FieldMetadata for all fields in a schema */
export function buildSchemaMetadataMap(
  schema: z.ZodObject<z.ZodRawShape>,
): Map<string, FieldMetadata> {
  const map = new Map<string, FieldMetadata>();
  for (const [name, fieldSchema] of Object.entries(schema.shape)) {
    const metadata = getFieldMetadata(fieldSchema as z.ZodType);
    if (metadata) map.set(name, metadata);
  }
  return map;
}
