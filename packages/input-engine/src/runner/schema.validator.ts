import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import type { FieldHandlerRegistry } from '../fields/field.handler.js';
import type { FieldMetadata } from '../input-engine.types.js';

/** Validated field entry: field name paired with its metadata */
interface ValidatedField {
  fieldName: string;
  metadata: FieldMetadata;
}

/** Validates a form schema before it is executed by the FormRunner */
export class SchemaValidator {
  constructor(private readonly registry: FieldHandlerRegistry) {}

  /**
   * Validate a z.object form schema.
   *
   * Checks:
   * 1. Every property has input-engine metadata in z.globalRegistry
   * 2. Every field has a non-empty i18nKey
   * 3. Every field's fieldType is registered in the FieldHandlerRegistry
   * 4. No circular conditional dependencies between fields
   *
   * @returns ok with the array of validated FieldMetadata entries, or err with AppError
   */
  validate(schema: z.ZodObject<z.ZodRawShape>): Result<FieldMetadata[], AppError> {
    const shape = schema.shape;
    const fieldNames = Object.keys(shape);
    const validatedFields: ValidatedField[] = [];

    for (const fieldName of fieldNames) {
      const fieldSchema = shape[fieldName];
      if (!fieldSchema) {
        return err(
          new AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID, {
            field: fieldName,
            reason: 'Field schema is undefined',
          }),
        );
      }

      const fieldResult = this.validateField(fieldName, fieldSchema as z.ZodType);
      if (fieldResult.isErr()) return err(fieldResult.error);

      validatedFields.push({ fieldName, metadata: fieldResult.value });
    }

    // Check for dangling dependsOn references
    const fieldNameSet = new Set(validatedFields.map((f) => f.fieldName));
    for (const { fieldName, metadata } of validatedFields) {
      if (metadata.conditions) {
        for (const condition of metadata.conditions) {
          if (!fieldNameSet.has(condition.dependsOn)) {
            return err(
              new AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID, {
                field: fieldName,
                reason: `Condition references unknown field '${condition.dependsOn}'`,
              }),
            );
          }
        }
      }
    }

    // Check for circular conditional dependencies using DFS
    const conditionMap = this.buildConditionMap(validatedFields);
    const cycle = this.detectCircularDependencies(conditionMap);
    if (cycle) {
      return err(new AppError(INPUT_ENGINE_ERRORS.SCHEMA_CIRCULAR_DEPENDENCY, { cycle }));
    }

    return ok(validatedFields.map((f) => f.metadata));
  }

  /** Validate a single field: extract metadata, check i18nKey, check handler exists */
  private validateField(
    fieldName: string,
    fieldSchema: z.ZodType,
  ): Result<FieldMetadata, AppError> {
    const registryMeta = z.globalRegistry.get(fieldSchema);
    const fieldMeta = (registryMeta as Record<string, unknown> | undefined)?.['input-engine'] as
      | FieldMetadata
      | undefined;

    if (!fieldMeta) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID, {
          field: fieldName,
          reason: 'Missing input-engine metadata in z.globalRegistry',
        }),
      );
    }

    if (!fieldMeta.i18nKey) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID, {
          field: fieldName,
          reason: 'i18nKey is empty',
        }),
      );
    }

    if (!this.registry.has(fieldMeta.fieldType)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN, {
          field: fieldName,
          fieldType: fieldMeta.fieldType,
        }),
      );
    }

    return ok(fieldMeta);
  }

  /** Build adjacency list of conditional dependencies from validated fields */
  private buildConditionMap(fields: ValidatedField[]): Map<string, string[]> {
    const conditionMap = new Map<string, string[]>();
    for (const { fieldName, metadata } of fields) {
      const deps = metadata.conditions?.map((c) => c.dependsOn) ?? [];
      conditionMap.set(fieldName, deps);
    }
    return conditionMap;
  }

  /**
   * Detect circular dependencies in the conditional field graph using DFS.
   *
   * @returns The cycle path as an array of field names if found, or null if no cycle exists.
   */
  private detectCircularDependencies(conditionMap: Map<string, string[]>): string[] | null {
    const enum VisitState {
      Unvisited = 0,
      InProgress = 1,
      Done = 2,
    }

    const state = new Map<string, VisitState>();
    const path: string[] = [];

    for (const node of conditionMap.keys()) {
      state.set(node, VisitState.Unvisited);
    }

    const dfs = (node: string): string[] | null => {
      state.set(node, VisitState.InProgress);
      path.push(node);

      const deps = conditionMap.get(node) ?? [];
      for (const dep of deps) {
        const depState = state.get(dep);
        if (depState === VisitState.InProgress) {
          const cycleStart = path.indexOf(dep);
          return [...path.slice(cycleStart), dep];
        }
        if (depState === VisitState.Unvisited) {
          const cycle = dfs(dep);
          if (cycle) return cycle;
        }
      }

      path.pop();
      state.set(node, VisitState.Done);
      return null;
    };

    for (const node of conditionMap.keys()) {
      if (state.get(node) === VisitState.Unvisited) {
        const cycle = dfs(node);
        if (cycle) return cycle;
      }
    }

    return null;
  }
}
