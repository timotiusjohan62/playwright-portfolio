import { z } from 'zod';

export function generateDynamicSchema(data: any): z.ZodType {
  // 1. Handle Nulls
  if (data === null) return z.nullable(z.any());
  if (data === undefined) return z.any();

  // 2. Handle Primitives
  if (typeof data === 'string') return z.string();
  if (typeof data === 'number') return z.number();
  if (typeof data === 'boolean') return z.boolean();

  // 3. Handle Arrays (Like your root JSON example)
  if (Array.isArray(data)) {
    if (data.length === 0) return z.array(z.any());
    
    // Infer the array's schema based on its first item
    return z.array(generateDynamicSchema(data[0]));
  }

  // 4. Handle Nested Objects
  if (typeof data === 'object') {
    const shape: Record<string, z.ZodType> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Recursively build the schema for every nested property
      shape[key] = generateDynamicSchema(value);
    }
    
    // Return a Zod object. Use .passthrough() if you want to allow 
    // unexpected extra fields without failing the test.
    return z.object(shape).passthrough(); 
  }

  return z.any();
}