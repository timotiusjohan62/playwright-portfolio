# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: WSIOEXC02
- Location: tests/example.spec.ts:158:9

# Error details

```
Error: apiRequestContext.fetch: Timeout 25000ms exceeded.
Call log:
  - → POST http://172.18.30.26:7083/tag/cf/report/exception
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - x-timestamp: 2026-10-27T16:52:19.286+07:00
    - x-signature: vB/GesPMzZxE49yR3Q8BscBgZpNgt24VNgU4M2UI+gg=
    - X-Btn-Key: c1500286-de11-4286-ba7e-090250090250
    - Btn-Reference-Number: B02501516287
    - Btn-User-Id: BTN0010042
    - Btn-Terminal-Id: PCDIMAS
    - Btn-Terminal-Ip: 10.99.17.134
    - content-type: application/json
    - content-length: 33

```

# Test source

```ts
  142 |     return undefined;
  143 |   }
  144 | }
  145 | 
  146 | const asJson = (o: unknown) => JSON.stringify(o, null, 2);
  147 | 
  148 | /**
  149 |  * Playwright's network errors embed a "Call log" with raw request headers (and ANSI colours).
  150 |  * Strip colours and mask sensitive header lines before the text goes anywhere.
  151 |  */
  152 | function sanitizeError(message: string): string {
  153 |   return message
  154 |     .replace(/\u001b\[[0-9;]*m/g, '')
  155 |     .replace(/^(\s*-?\s*)([A-Za-z0-9-]+):[ \t]*.*$/gm, (line, pre: string, name: string) =>
  156 |       MASK_HEADERS.has(name.toLowerCase()) ? `${pre}${name}: ${MASK}` : line,
  157 |     );
  158 | }
  159 | 
  160 | /* ------------------------------------------------------------------ */
  161 | /* Assertion helpers with full call context in the error message        */
  162 | /* ------------------------------------------------------------------ */
  163 | 
  164 | /** "GET https://host/path?x=1 -> 200" : use as a label for assertSchema etc. */
  165 | export function describeCall(res: APIResponse): string {
  166 |   const c = callByResponse.get(res);
  167 |   return c ? `${c.method} ${c.url} -> ${c.status}` : res.url();
  168 | }
  169 | 
  170 | /** Like expect(res.status()).toBe(...) but the error includes method, URL and body preview. */
  171 | export function expectStatus(res: APIResponse, expected: number | number[]): void {
  172 |   const allowed = Array.isArray(expected) ? expected : [expected];
  173 |   if (allowed.includes(res.status())) return;
  174 |   const c = callByResponse.get(res);
  175 |   const preview = (c?.responseBody ?? '').slice(0, 1000);
  176 |   throw new Error(
  177 |     `Expected status ${allowed.join(' or ')} but got ${res.status()}\n` +
  178 |     `Request:  ${describeCall(res)}\n` +
  179 |     `Response body: ${preview || '(empty)'}`,
  180 |   );
  181 | }
  182 | 
  183 | /* ------------------------------------------------------------------ */
  184 | /* The fixture                                                         */
  185 | /* ------------------------------------------------------------------ */
  186 | export const test = base.extend<{ api: ApiClient }>({
  187 |   api: async ({ request }, use, testInfo) => {
  188 |     const calls: CallRecord[] = [];
  189 |     // Inside a step: attach directly to that step. After the test (teardown): attach to the test.
  190 |     const attach = (name: string, body: string, contentType: string) =>
  191 |       allure.attachment(name, body, { contentType });
  192 |     const attachToTest = (name: string, body: string, contentType: string) =>
  193 |       testInfo.attach(name, { body, contentType });
  194 | 
  195 |     const run = async (method: string, url: string, opts: CallOpts = {}): Promise<APIResponse> => {
  196 |       const { title, ...fetchOpts } = opts;
  197 |       const baseURL = testInfo.project.use.baseURL;
  198 |       const configHeaders = (testInfo.project.use.extraHTTPHeaders ?? {}) as Record<string, string>;
  199 |       const sentHeaders = {
  200 |         ...configHeaders,
  201 |         ...inferContentType(fetchOpts),
  202 |         ...((fetchOpts.headers as Record<string, string>) ?? {}),
  203 |       };
  204 |       const maskedReqHeaders = maskHeaders(sentHeaders);
  205 |       const reqBody = serializeRequestBody(fetchOpts);
  206 |       const resolved = resolveUrl(url, baseURL, fetchOpts.params);
  207 |       const preUrl = resolved?.toString() ?? url;
  208 |       const prePath = resolved ? resolved.pathname : url;
  209 |       const preQuery = resolved ? Object.fromEntries(resolved.searchParams.entries()) : {};
  210 |       const label = title ?? `${method} ${resolved ? resolved.pathname + resolved.search : url}`;
  211 | 
  212 |       let response!: APIResponse;
  213 | 
  214 |       await allure.step(label, async (ctx) => {
  215 |         await ctx.parameter('method', method);
  216 |         await ctx.parameter('path', prePath);
  217 | 
  218 |         // ---- Request details (attached BEFORE sending, so they exist even if the call throws)
  219 |         // ---- Request details (attached BEFORE sending, so they exist even if the call throws)
  220 |         await attach('Endpoint', `${method} ${preUrl}`, 'text/plain');
  221 |         await attach('Request', asJson({
  222 |           method, url: preUrl, path: prePath, query: preQuery, headers: maskedReqHeaders,
  223 |           hasBody: !!reqBody,
  224 |         }), 'application/json');
  225 |         if (reqBody) await attach('Request body', truncate(reqBody.pretty), reqBody.type);
  226 | 
  227 |         const record: CallRecord = {
  228 |           index: calls.length + 1, method, url: preUrl, path: prePath, query: preQuery,
  229 |           requestHeaders: maskedReqHeaders, requestBody: reqBody ? truncate(reqBody.pretty) : undefined,
  230 |           status: 0, statusText: '', responseHeaders: {}, durationMs: 0, sizeBytes: 0,
  231 |         };
  232 | 
  233 |         const started = Date.now();
  234 |         try {
  235 |           response = await request.fetch(url, { ...fetchOpts, method });
  236 |         } catch (e: any) {
  237 |           record.durationMs = Date.now() - started;
  238 |           record.error = sanitizeError(String(e?.message ?? e));
  239 |           calls.push(record);
  240 |           await ctx.displayName(`${label} -> ERROR (${record.durationMs} ms)`);
  241 |           await attach('Request error', record.error, 'text/plain');
> 242 |           throw new Error(record.error, { cause: e });
      |                 ^ Error: apiRequestContext.fetch: Timeout 25000ms exceeded.
  243 |         }
  244 |         record.durationMs = Date.now() - started;
  245 | 
  246 |         // ---- Response details
  247 |         const buf = await response.body();
  248 |         const headers = maskHeaders(response.headers());
  249 |         const ctype = headers['content-type'] ?? '';
  250 |         const textual = !ctype || TEXTUAL.test(ctype);
  251 |         record.url = response.url();
  252 |         const finalUrl = new URL(record.url);
  253 |         record.path = finalUrl.pathname;
  254 |         record.query = Object.fromEntries(finalUrl.searchParams.entries());
  255 |         record.status = response.status();
  256 |         record.statusText = response.statusText();
  257 |         record.responseHeaders = headers;
  258 |         record.sizeBytes = buf.length;
  259 | 
  260 |         let respPretty = '';
  261 |         let respType = 'text/plain';
  262 |         if (buf.length === 0) {
  263 |           respPretty = '(empty body)';
  264 |         } else if (textual) {
  265 |           const f = formatText(buf.toString('utf8'));
  266 |           respPretty = truncate(f.pretty);
  267 |           respType = f.isJson ? 'application/json' : 'text/plain';
  268 |         } else {
  269 |           respPretty = `<binary ${buf.length} bytes, content-type: ${ctype}>`;
  270 |         }
  271 |         record.responseBody = respPretty;
  272 | 
  273 |         await ctx.parameter('status', `${record.status} ${record.statusText}`.trim());
  274 |         await ctx.displayName(`${label} -> ${record.status} (${record.durationMs} ms)`);
  275 | 
  276 |         await attach('Response', asJson({
  277 |           status: record.status, statusText: record.statusText, ok: response.ok(),
  278 |           durationMs: record.durationMs, sizeBytes: record.sizeBytes, url: record.url,
  279 |           headers,
  280 |         }), 'application/json');
  281 |         await attach('Response body', respPretty, respType);
  282 | 
  283 |         calls.push(record);
  284 |         callByResponse.set(response, record);
  285 |       });
  286 | 
  287 |       return response;
  288 |     };
  289 | 
  290 |     const m = (method: string): Call => (url, opts) => run(method, url, opts);
  291 | 
  292 |     await use({
  293 |       get: m('GET'), post: m('POST'), put: m('PUT'), patch: m('PATCH'),
  294 |       delete: m('DELETE'), head: m('HEAD'), call: run, calls,
  295 |     });
  296 | 
  297 |     // ---- Failure context: runs after the test body, only when the test did not pass
  298 |     if (calls.length && testInfo.status !== testInfo.expectedStatus) {
  299 |       await attachToTest(
  300 |         'API call history',
  301 |         calls
  302 |           .map((c) => `#${c.index} ${c.method} ${c.path} -> ${c.error ? 'ERROR' : c.status} (${c.durationMs} ms)`)
  303 |           .join('\n'),
  304 |         'text/plain',
  305 |       );
  306 |       const culprit = [...calls].reverse().find((c) => c.error || c.status >= 400) ?? calls[calls.length - 1];
  307 |       await attachToTest(`Failure context: last problem call #${culprit.index}`, asJson(culprit), 'application/json');
  308 |     }
  309 |   },
  310 | });
  311 | 
  312 | export { expect, allure };
  313 | 
```