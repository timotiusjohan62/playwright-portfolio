import { z } from 'zod';

export function generateDynamicSchema(
  data: unknown,
  options: { makeFieldsOptional?: boolean } = { makeFieldsOptional: true }
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
      generateDynamicSchema(item, options)
    );
    return z.array(mergeSchemas(itemSchemas));
  }

  if (type === 'object') {
    const shape: Record<string, z.ZodType> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      let fieldSchema = generateDynamicSchema(value, options);

      if (options.makeFieldsOptional) {
        fieldSchema = fieldSchema.optional().nullable();
      }

      shape[key] = fieldSchema;
    }

    // Change z.object(shape) to .strict() if you want to reject unexpected fields!
    return z.object(shape).strict(); 
  }

  return z.unknown();
}

function mergeSchemas(schemas: z.ZodType[]): z.ZodType {
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

      let fieldSchema = mergeSchemas(fieldSchemas);

      if (missingInSomeObjects) {
        fieldSchema = fieldSchema.optional();
      }

      mergedShape[key] = fieldSchema;
    });

    return z.object(mergedShape);
  }

  const uniqueSchemas = deduplicateSchemas(schemas);
  if (uniqueSchemas.length === 1) return uniqueSchemas[0];

  return z.union(
    uniqueSchemas as [z.ZodType, z.ZodType, ...z.ZodType[]]
  );
}

function deduplicateSchemas(schemas: z.ZodType[]): z.ZodType[] {
  const seen = new Set<string>();
  const result: z.ZodType[] = [];

  for (const schema of schemas) {
    const key = schema.constructor.name;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(schema);
    }
  }

  return result;
}