import { z } from 'zod';

export function generateDynamicSchema(data: any): z.ZodType {
  if (data === null) return z.nullable(z.any());
  if (data === undefined) return z.any();
 
  if (typeof data === 'string') return z.string();
  if (typeof data === 'number') return z.number();
  if (typeof data === 'boolean') return z.boolean();
 
  // Fix: Merge keys from all array items to support mixed/heterogeneous structures
  if (Array.isArray(data)) {
    if (data.length === 0) return z.array(z.any());
    
    const mergedObject = data.reduce((acc, item) => {
      if (typeof item === 'object' && item !== null) {
        return { ...acc, ...item };
      }
      return acc;
    }, {});
 
    return z.array(generateDynamicSchema(mergedObject));
  }
 
  if (typeof data === 'object') {
    const shape: Record<string, z.ZodType> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Use .optional() if a key might be missing across different array items
      shape[key] = generateDynamicSchema(value).optional();
    }
    
    return z.object(shape).loose();
  }
 
  return z.any();
}