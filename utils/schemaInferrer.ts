import { z } from 'zod';

export interface DynamicSchemaOptions {
  makeFieldsOptional?: boolean;        // Applies to top-level root fields (defaults to true)
  makeNestedFieldsOptional?: boolean;  // Applies to nested object fields (defaults to false for strictness)
  allowExtraFields?: boolean;          // Allows unknown/extra keys in responses (defaults to true)
}

/**
 * Dynamically generates a Zod schema from an unknown data sample.
 */
export function generateDynamicSchema(
  data: unknown,
  options: DynamicSchemaOptions = { 
    makeFieldsOptional: true, 
    makeNestedFieldsOptional: false, 
    allowExtraFields: true 
  },
  isRoot: boolean = true
): z.ZodType {
  if (data === null) return z.null().nullable();
  if (data === undefined) return z.unknown().optional();

  const type = typeof data;
  if (type === 'string') return z.string();
  if (type === 'number') return z.number();
  if (type === 'boolean') return z.boolean();

  if (Array.isArray(data)) {
    if (data.length === 0) return z.array(z.unknown());
    const itemSchemas = data.map((item) =>
      generateDynamicSchema(item, options, false)
    );
    return z.array(mergeSchemas(itemSchemas, options));
  }

  if (type === 'object') {
    const shape: Record<string, z.ZodType> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      let fieldSchema = generateDynamicSchema(value, options, false);

      // Root fields can be optional, but nested fields stay strict by default
      const shouldBeOptional = isRoot 
        ? options.makeFieldsOptional 
        : options.makeNestedFieldsOptional;

      if (shouldBeOptional) {
        fieldSchema = fieldSchema.optional().nullable();
      }

      shape[key] = fieldSchema;
    }

    const baseObject = z.object(shape);
    return options.allowExtraFields ? baseObject.loose() : baseObject.strict();
  }

  return z.unknown();
}

/**
 * Merges multiple Zod schemas (useful for arrays with varying item structures).
 */
function mergeSchemas(schemas: z.ZodType[], options: DynamicSchemaOptions): z.ZodType {
  if (schemas.length === 0) return z.unknown();
  if (schemas.length === 1) return schemas[0];

  const isAllObjects = schemas.every((s) => s instanceof z.ZodObject);

  if (isAllObjects) {
    const objectSchemas = schemas as z.ZodObject<Record<string, z.ZodType>>[];
    const allKeys = new Set<string>();

    objectSchemas.forEach((s) => {
      Object.keys(s.shape).forEach((k) => allKeys.add(k));
    });

    const mergedShape: Record<string, z.ZodType> = {};

    allKeys.forEach((key) => {
      const fieldSchemas: z.ZodType[] = [];
      let missingInSomeObjects = false;

      objectSchemas.forEach((s) => {
        if (key in s.shape) {
          fieldSchemas.push(s.shape[key]);
        } else {
          missingInSomeObjects = true;
        }
      });

      let fieldSchema = mergeSchemas(fieldSchemas, options);

      if (missingInSomeObjects) {
        fieldSchema = fieldSchema.optional();
      }

      mergedShape[key] = fieldSchema;
    });

    const baseObject = z.object(mergedShape);
    return options.allowExtraFields ? baseObject.loose() : baseObject.strict();
  }

  const uniqueSchemas = deduplicateSchemas(schemas);
  if (uniqueSchemas.length === 1) return uniqueSchemas[0];

  return z.union(
    uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]
  );
}

/**
 * Deduplicates schemas using Zod's internal type definition name 
 * to ensure compatibility with production code minifiers (Terser/Vite).
 */
function deduplicateSchemas(schemas: z.ZodType[]): z.ZodType[] {
  const seen = new Set<string>();
  const result: z.ZodType[] = [];

  for (const schema of schemas) {
    const typeName = (schema as any)._def?.typeName || schema.constructor.name;

    if (!seen.has(typeName)) {
      seen.add(typeName);
      result.push(schema);
    }
  }

  return result;
}