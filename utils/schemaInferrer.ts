import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */
export interface InferOptions {
  /** Reject keys not seen in the samples. Default false (extra keys allowed). */
  strict?: boolean;
  /** Make every object key optional (most lenient). Default false. */
  allKeysOptional?: boolean;
  /** Detect uuid / email / date / datetime / url strings. Default false. */
  detectFormats?: boolean;
  /** Treat objects keyed by ids ({"12": {...}, "13": {...}}) as records. Default true. */
  detectRecords?: boolean;
  /** Max array items sampled per array (performance guard). Default 500. */
  maxArraySamples?: number;
}

const DEFAULTS: Required<InferOptions> = {
  strict: false,
  allKeysOptional: false,
  detectFormats: false,
  detectRecords: true,
  maxArraySamples: 500,
};

/* ------------------------------------------------------------------ */
/* Intermediate representation (JSON-serialisable, so it can be saved) */
/* ------------------------------------------------------------------ */
export type StringFormat = 'uuid' | 'email' | 'date' | 'datetime' | 'url';

export type IR =
  | { kind: 'never' } // nothing observed yet (e.g. empty array items)
  | { kind: 'any' }
  | { kind: 'null' }
  | { kind: 'string'; format?: StringFormat }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'array'; item: IR }
  | { kind: 'record'; value: IR }
  | { kind: 'object'; props: Record<string, { ir: IR; optional: boolean }> }
  | { kind: 'union'; options: IR[] };

const NEVER: IR = { kind: 'never' };

const FORMATS: Record<StringFormat, RegExp> = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
  url: /^https?:\/\/\S+$/,
};

function detectFormat(s: string): StringFormat | undefined {
  return (Object.keys(FORMATS) as StringFormat[]).find((f) => FORMATS[f].test(s));
}

const ID_KEY = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const looksLikeRecord = (entries: [string, unknown][]) =>
  entries.length >= 3 && entries.every(([k]) => ID_KEY.test(k));

/* ------------------------------------------------------------------ */
/* Step 1: infer an IR from one value                                  */
/* ------------------------------------------------------------------ */
function infer(data: unknown, o: Required<InferOptions>): IR {
  if (data === undefined) return NEVER;
  if (data === null) return { kind: 'null' };

  switch (typeof data) {
    case 'string':
      return { kind: 'string', format: o.detectFormats ? detectFormat(data) : undefined };
    case 'number':
      return { kind: 'number' };
    case 'boolean':
      return { kind: 'boolean' };
    case 'object':
      break;
    default:
      return { kind: 'any' };
  }

  if (Array.isArray(data)) {
    // Merge ALL items (not just the first) so optional/nullable/mixed fields are captured
    const item = data
      .slice(0, o.maxArraySamples)
      .reduce<IR>((acc, v) => mergeIR(acc, infer(v, o)), NEVER);
    return { kind: 'array', item };
  }

  const entries = Object.entries(data as Record<string, unknown>).filter(([, v]) => v !== undefined);

  if (o.detectRecords && looksLikeRecord(entries)) {
    return {
      kind: 'record',
      value: entries.reduce<IR>((acc, [, v]) => mergeIR(acc, infer(v, o)), NEVER),
    };
  }

  const props: Record<string, { ir: IR; optional: boolean }> = {};
  for (const [k, v] of entries) props[k] = { ir: infer(v, o), optional: o.allKeysOptional };
  return { kind: 'object', props };
}

/* ------------------------------------------------------------------ */
/* Step 2: merge two IRs (this is what makes it "flexible")            */
/* ------------------------------------------------------------------ */
export function mergeIR(a: IR, b: IR): IR {
  if (a.kind === 'never') return b;
  if (b.kind === 'never') return a;
  if (a.kind === 'any' || b.kind === 'any') return { kind: 'any' };

  if (a.kind === 'union' || b.kind === 'union') {
    return normalizeUnion([
      ...(a.kind === 'union' ? a.options : [a]),
      ...(b.kind === 'union' ? b.options : [b]),
    ]);
  }

  // Different types (e.g. string vs null, number vs string) -> union
  if (a.kind !== b.kind) return normalizeUnion([a, b]);

  switch (a.kind) {
    case 'string': {
      const other = b as Extract<IR, { kind: 'string' }>;
      return { kind: 'string', format: a.format === other.format ? a.format : undefined };
    }
    case 'array': {
      const other = b as Extract<IR, { kind: 'array' }>;
      return { kind: 'array', item: mergeIR(a.item, other.item) };
    }
    case 'record': {
      const other = b as Extract<IR, { kind: 'record' }>;
      return { kind: 'record', value: mergeIR(a.value, other.value) };
    }
    case 'object': {
      const other = b as Extract<IR, { kind: 'object' }>;
      const props: Record<string, { ir: IR; optional: boolean }> = {};
      for (const k of new Set([...Object.keys(a.props), ...Object.keys(other.props)])) {
        const pa = a.props[k];
        const pb = other.props[k];
        props[k] =
          pa && pb
            ? { ir: mergeIR(pa.ir, pb.ir), optional: pa.optional || pb.optional }
            : { ir: (pa ?? pb).ir, optional: true }; // key missing in some samples
      }
      return { kind: 'object', props };
    }
    default:
      return a; // null, number, boolean
  }
}

function normalizeUnion(options: IR[]): IR {
  const out: IR[] = [];
  for (const opt of options) {
    if (opt.kind === 'never') continue;
    if (opt.kind === 'any') return opt;
    const i = out.findIndex((x) => x.kind === opt.kind);
    if (i >= 0) out[i] = mergeIR(out[i], opt); // same kind -> merge, no duplicate branches
    else out.push(opt);
  }
  if (out.length === 0) return NEVER;
  return out.length === 1 ? out[0] : { kind: 'union', options: out };
}

/* ------------------------------------------------------------------ */
/* Step 3: IR -> Zod                                                    */
/* ------------------------------------------------------------------ */
export function irToZod(ir: IR, opts: InferOptions = {}): z.ZodType {
  const o = { ...DEFAULTS, ...opts };
  switch (ir.kind) {
    case 'never':
    case 'any':
      return z.any();
    case 'null':
      return z.null();
    case 'string':
      return ir.format
        ? z.string().regex(FORMATS[ir.format], `Expected ${ir.format}`)
        : z.string();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'array':
      return z.array(irToZod(ir.item, o));
    case 'record':
      return z.record(z.string(), irToZod(ir.value, o));
    case 'object': {
      const shape: Record<string, z.ZodType> = {};
      for (const [k, p] of Object.entries(ir.props)) {
        const s = irToZod(p.ir, o);
        shape[k] = p.optional ? s.optional() : s;
      }
      const obj = z.object(shape);
      return o.strict ? obj.strict() : obj.passthrough();
    }
    case 'union': {
      const hasNull = ir.options.some((x) => x.kind === 'null');
      const rest = ir.options.filter((x) => x.kind !== 'null').map((x) => irToZod(x, o));
      if (rest.length === 0) return z.null();
      const base =
        rest.length === 1 ? rest[0] : z.union(rest as [z.ZodType, z.ZodType, ...z.ZodType[]]);
      return hasNull ? base.nullable() : base;
    }
    default:
      return z.any();
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/** Infer from several sample responses of the same endpoint (best accuracy). */
export function inferIRFromSamples(samples: unknown[], opts: InferOptions = {}): IR {
  const o = { ...DEFAULTS, ...opts };
  return samples.reduce<IR>((acc, s) => mergeIR(acc, infer(s, o)), NEVER);
}

export function generateSchemaFromSamples(samples: unknown[], opts: InferOptions = {}): z.ZodType {
  return irToZod(inferIRFromSamples(samples, opts), opts);
}

/** Drop-in replacement for your original function (single sample). */
export function generateDynamicSchema(data: unknown, opts: InferOptions = {}): z.ZodType {
  return generateSchemaFromSamples([data], opts);
}

/** Throws one readable error listing every mismatch (path: message). */
export function assertSchema(schema: z.ZodType, data: unknown, label = 'Response'): void {
  const result = schema.safeParse(data);
  if (result.success) return;
  const lines = result.error.issues.map(
    (i) => `  - ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`,
  );
  throw new Error(`${label} does not match schema:\n${lines.join('\n')}`);
}