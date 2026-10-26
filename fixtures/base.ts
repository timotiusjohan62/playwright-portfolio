import { test as base, expect, APIRequestContext, APIResponse } from '@playwright/test';
import * as allure from 'allure-js-commons';

/* ------------------------------------------------------------------ */
/* Config: what to hide and how much to keep                           */
/* ------------------------------------------------------------------ */
const MASK = '***';
const MASK_HEADERS = new Set([
  'authorization', 'proxy-authorization', 'cookie', 'set-cookie',
  'x-api-key', 'x-auth-token', 'x-csrf-token',
]);
const MASK_BODY_KEYS =
  /^(password|passwd|pwd|secret|token|access_?token|refresh_?token|id_?token|client_?secret|api_?key|authorization)$/i;
const MAX_BODY_CHARS = 200_000;
const TEXTUAL = /json|text|xml|javascript|html|x-www-form-urlencoded|graphql|yaml/i;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type FetchOpts = NonNullable<Parameters<APIRequestContext['fetch']>[1]>;
/** Same options as Playwright's request.fetch, plus an optional custom step title. */
export type CallOpts = Omit<FetchOpts, 'method'> & { title?: string };

export interface CallRecord {
  index: number;
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  durationMs: number;
  sizeBytes: number;
  error?: string;
}

type Call = (url: string, opts?: CallOpts) => Promise<APIResponse>;
export interface ApiClient {
  get: Call; post: Call; put: Call; patch: Call; delete: Call; head: Call;
  call: (method: string, url: string, opts?: CallOpts) => Promise<APIResponse>;
  /** Every call made in this test, in order. */
  calls: CallRecord[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const callByResponse = new WeakMap<APIResponse, CallRecord>();

const maskHeaders = (h: Record<string, string> = {}) =>
  Object.fromEntries(
    Object.entries(h).map(([k, v]) => [k, MASK_HEADERS.has(k.toLowerCase()) ? MASK : String(v)]),
  );

function maskDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(maskDeep);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k,
        MASK_BODY_KEYS.test(k) ? MASK : maskDeep(val),
      ]),
    );
  }
  return v;
}

const truncate = (s: string) =>
  s.length > MAX_BODY_CHARS ? `${s.slice(0, MAX_BODY_CHARS)}\n... [truncated ${s.length - MAX_BODY_CHARS} chars]` : s;

function formatText(raw: string) {
  try {
    const masked = maskDeep(JSON.parse(raw));
    return { pretty: JSON.stringify(masked, null, 2), compact: JSON.stringify(masked), isJson: true };
  } catch {
    return { pretty: raw, compact: raw, isJson: false };
  }
}

interface ReqBody { pretty: string; compact?: string; type: string; }

function serializeRequestBody(o: FetchOpts): ReqBody | undefined {
  const { data, form, multipart } = o as any;
  if (data !== undefined && data !== null) {
    if (Buffer.isBuffer(data)) {
      const s = `<binary ${data.length} bytes>`;
      return { pretty: s, type: 'text/plain' };
    }
    if (typeof data === 'string') {
      const f = formatText(data);
      return { pretty: f.pretty, compact: f.compact, type: f.isJson ? 'application/json' : 'text/plain' };
    }
    const m = maskDeep(data);
    return { pretty: JSON.stringify(m, null, 2), compact: JSON.stringify(m), type: 'application/json' };
  }
  if (form) {
    const m = maskDeep(form) as Record<string, string>;
    return {
      pretty: JSON.stringify(m, null, 2),
      compact: new URLSearchParams(Object.entries(m).map(([k, v]) => [k, String(v)])).toString(),
      type: 'application/json',
    };
  }
  if (multipart) {
    const desc = Object.fromEntries(
      Object.entries(multipart as Record<string, any>).map(([k, v]) => [
        k,
        v && typeof v === 'object' && 'buffer' in v
          ? `<file ${v.name ?? ''} ${v.mimeType ?? ''} ${v.buffer?.length ?? 0} bytes>`
          : MASK_BODY_KEYS.test(k) ? MASK : v?.path ? `<file stream>` : v,
      ]),
    );
    return { pretty: JSON.stringify(desc, null, 2), type: 'application/json' };
  }
  return undefined;
}

function inferContentType(o: FetchOpts): Record<string, string> {
  const { data, form, multipart } = o as any;
  if (form) return { 'content-type': 'application/x-www-form-urlencoded' };
  if (multipart) return { 'content-type': 'multipart/form-data' };
  if (data !== undefined && data !== null && typeof data !== 'string' && !Buffer.isBuffer(data)) {
    return { 'content-type': 'application/json' };
  }
  return {};
}

function resolveUrl(url: string, baseURL: string | undefined, params: FetchOpts['params']) {
  try {
    const u = new URL(url, baseURL);
    if (params) {
      if (typeof params === 'string') new URLSearchParams(params).forEach((v, k) => u.searchParams.append(k, v));
      else if (params instanceof URLSearchParams) params.forEach((v, k) => u.searchParams.append(k, v));
      else for (const [k, v] of Object.entries(params)) u.searchParams.append(k, String(v));
    }
    return u;
  } catch {
    return undefined;
  }
}

const asJson = (o: unknown) => JSON.stringify(o, null, 2);

/**
 * Playwright's network errors embed a "Call log" with raw request headers (and ANSI colours).
 * Strip colours and mask sensitive header lines before the text goes anywhere.
 */
function sanitizeError(message: string): string {
  return message
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/^(\s*-?\s*)([A-Za-z0-9-]+):[ \t]*.*$/gm, (line, pre: string, name: string) =>
      MASK_HEADERS.has(name.toLowerCase()) ? `${pre}${name}: ${MASK}` : line,
    );
}

/* ------------------------------------------------------------------ */
/* Assertion helpers with full call context in the error message        */
/* ------------------------------------------------------------------ */

/** "GET https://host/path?x=1 -> 200" : use as a label for assertSchema etc. */
export function describeCall(res: APIResponse): string {
  const c = callByResponse.get(res);
  return c ? `${c.method} ${c.url} -> ${c.status}` : res.url();
}

/** Like expect(res.status()).toBe(...) but the error includes method, URL and body preview. */
export function expectStatus(res: APIResponse, expected: number | number[]): void {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (allowed.includes(res.status())) return;
  const c = callByResponse.get(res);
  const preview = (c?.responseBody ?? '').slice(0, 1000);
  throw new Error(
    `Expected status ${allowed.join(' or ')} but got ${res.status()}\n` +
    `Request:  ${describeCall(res)}\n` +
    `Response body: ${preview || '(empty)'}`,
  );
}

/* ------------------------------------------------------------------ */
/* The fixture                                                         */
/* ------------------------------------------------------------------ */
export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use, testInfo) => {
    const calls: CallRecord[] = [];
    // Inside a step: attach directly to that step. After the test (teardown): attach to the test.
    const attach = (name: string, body: string, contentType: string) =>
      allure.attachment(name, body, { contentType });
    const attachToTest = (name: string, body: string, contentType: string) =>
      testInfo.attach(name, { body, contentType });

    const run = async (method: string, url: string, opts: CallOpts = {}): Promise<APIResponse> => {
      const { title, ...fetchOpts } = opts;
      const baseURL = testInfo.project.use.baseURL;
      const configHeaders = (testInfo.project.use.extraHTTPHeaders ?? {}) as Record<string, string>;
      const sentHeaders = {
        ...configHeaders,
        ...inferContentType(fetchOpts),
        ...((fetchOpts.headers as Record<string, string>) ?? {}),
      };
      const maskedReqHeaders = maskHeaders(sentHeaders);
      const reqBody = serializeRequestBody(fetchOpts);
      const resolved = resolveUrl(url, baseURL, fetchOpts.params);
      const preUrl = resolved?.toString() ?? url;
      const prePath = resolved ? resolved.pathname : url;
      const preQuery = resolved ? Object.fromEntries(resolved.searchParams.entries()) : {};
      const label = title ?? `${method} ${resolved ? resolved.pathname + resolved.search : url}`;

      let response!: APIResponse;

      await allure.step(label, async (ctx) => {
        await ctx.parameter('method', method);
        await ctx.parameter('path', prePath);

        // ---- Request details (attached BEFORE sending, so they exist even if the call throws)
        // ---- Request details (attached BEFORE sending, so they exist even if the call throws)
        await attach('Endpoint', `${method} ${preUrl}`, 'text/plain');
        await attach('Request', asJson({
          method, url: preUrl, path: prePath, query: preQuery, headers: maskedReqHeaders,
          hasBody: !!reqBody,
        }), 'application/json');
        if (reqBody) await attach('Request body', truncate(reqBody.pretty), reqBody.type);

        const record: CallRecord = {
          index: calls.length + 1, method, url: preUrl, path: prePath, query: preQuery,
          requestHeaders: maskedReqHeaders, requestBody: reqBody ? truncate(reqBody.pretty) : undefined,
          status: 0, statusText: '', responseHeaders: {}, durationMs: 0, sizeBytes: 0,
        };

        const started = Date.now();
        try {
          response = await request.fetch(url, { ...fetchOpts, method });
        } catch (e: any) {
          record.durationMs = Date.now() - started;
          record.error = sanitizeError(String(e?.message ?? e));
          calls.push(record);
          await ctx.displayName(`${label} -> ERROR (${record.durationMs} ms)`);
          await attach('Request error', record.error, 'text/plain');
          throw new Error(record.error, { cause: e });
        }
        record.durationMs = Date.now() - started;

        // ---- Response details
        const buf = await response.body();
        const headers = maskHeaders(response.headers());
        const ctype = headers['content-type'] ?? '';
        const textual = !ctype || TEXTUAL.test(ctype);
        record.url = response.url();
        const finalUrl = new URL(record.url);
        record.path = finalUrl.pathname;
        record.query = Object.fromEntries(finalUrl.searchParams.entries());
        record.status = response.status();
        record.statusText = response.statusText();
        record.responseHeaders = headers;
        record.sizeBytes = buf.length;

        let respPretty = '';
        let respType = 'text/plain';
        if (buf.length === 0) {
          respPretty = '(empty body)';
        } else if (textual) {
          const f = formatText(buf.toString('utf8'));
          respPretty = truncate(f.pretty);
          respType = f.isJson ? 'application/json' : 'text/plain';
        } else {
          respPretty = `<binary ${buf.length} bytes, content-type: ${ctype}>`;
        }
        record.responseBody = respPretty;

        await ctx.parameter('status', `${record.status} ${record.statusText}`.trim());
        await ctx.displayName(`${label} -> ${record.status} (${record.durationMs} ms)`);

        await attach('Response', asJson({
          status: record.status, statusText: record.statusText, ok: response.ok(),
          durationMs: record.durationMs, sizeBytes: record.sizeBytes, url: record.url,
          headers,
        }), 'application/json');
        await attach('Response body', respPretty, respType);

        calls.push(record);
        callByResponse.set(response, record);
      });

      return response;
    };

    const m = (method: string): Call => (url, opts) => run(method, url, opts);

    await use({
      get: m('GET'), post: m('POST'), put: m('PUT'), patch: m('PATCH'),
      delete: m('DELETE'), head: m('HEAD'), call: run, calls,
    });

    // ---- Failure context: runs after the test body, only when the test did not pass
    if (calls.length && testInfo.status !== testInfo.expectedStatus) {
      await attachToTest(
        'API call history',
        calls
          .map((c) => `#${c.index} ${c.method} ${c.path} -> ${c.error ? 'ERROR' : c.status} (${c.durationMs} ms)`)
          .join('\n'),
        'text/plain',
      );
      const culprit = [...calls].reverse().find((c) => c.error || c.status >= 400) ?? calls[calls.length - 1];
      await attachToTest(`Failure context: last problem call #${culprit.index}`, asJson(culprit), 'application/json');
    }
  },
});

export { expect, allure };
