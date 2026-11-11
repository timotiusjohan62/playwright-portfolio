# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: BP-MPN WORKSFLOW - DJP - 9112
- Location: tests/example.spec.ts:204:9

# Error details

```
Error: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "subResponses",
      0,
      "shortName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "subResponses",
      0,
      "accountNumber"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "subResponses",
      0,
      "passbookSerial"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "subResponses",
      0,
      "currentBalance"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "subResponses",
      0,
      "availableBalance"
    ],
    "message": "Invalid input: expected number, received undefined"
  }
]

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  215 |       if (siteUnderTest) await allure.link(siteUnderTest, 'Site under test');
  216 | 
  217 |       // Scale the timeout with the workload instead of a fixed 90s that retries could exceed.
  218 |       test.setTimeout(Math.max(90_000, steps.length * (REQUEST_TIMEOUT_MS + 10_000)));
  219 | 
  220 |       expect(steps.length, `No steps found for scenario "${workflowName}"`).toBeGreaterThan(0);
  221 | 
  222 |       // Per-scenario state passed between steps (tokens, generated IDs, ...).
  223 |       const testState: Record<string, any> = {};
  224 | 
  225 |       for (const step of steps) {
  226 |         await allure.step(`Step ${step.STEP_ORDER}: ${step.TITLE}`, async (ctx) => {
  227 |           const method = step.TYPE.toUpperCase();
  228 |           const expectedStatus = Number(step.EXPECTED_STATUS);
  229 |           await ctx.parameter('Expected status', String(expectedStatus));
  230 | 
  231 |           // --- Phase 1: Variable hydration ---
  232 |           const sequenceNumber = getNextSequence(); // exactly one atomic reservation per step
  233 |           const hydrated = hydrate(step.PATH, step.PAYLOAD, testState, sequenceNumber);
  234 | 
  235 |           assertNoUnresolvedPlaceholders(step, 'PATH', hydrated.endpoint);
  236 |           assertNoUnresolvedPlaceholders(step, 'PAYLOAD', hydrated.payload);
  237 | 
  238 |           let requestData: any;
  239 |           try {
  240 |             requestData = hydrated.payload ? JSON.parse(hydrated.payload) : undefined;
  241 |           } catch (e: any) {
  242 |             throw new Error(`Invalid JSON payload for "${step.TITLE}": ${e.message}\n${hydrated.payload}`);
  243 |           }
  244 | 
  245 |           // Sign and send the *same* serialized string. Previously the signature was computed over the
  246 |           // DB string while Playwright re-serialized the object, so whitespace/key formatting could
  247 |           // differ and cause intermittent signature failures.
  248 |           const bodyString = requestData !== undefined ? JSON.stringify(requestData) : null;
  249 |           const finalUrl = resolveFetchEndpoint(hydrated.endpoint, baseURL);
  250 |           const signedHeaders = getSignedHeaders(method, cleanPathForSignature(hydrated.endpoint), bodyString);
  251 | 
  252 |           const headers: Record<string, string> = {
  253 |             ...signedHeaders,
  254 |             ...(bodyString !== null ? { 'Content-Type': 'application/json' } : {}),
  255 |             'X-Btn-Key': process.env.API_KEY || '',
  256 |             'Btn-Reference-Number': `B0250${sequenceNumber}`,
  257 |             ...CLIENT_HEADERS,
  258 |           };
  259 | 
  260 |           await allure.attachment(
  261 |             'Request',
  262 |             JSON.stringify({ method, url: finalUrl, body: requestData }, null, 2),
  263 |             'application/json'
  264 |           );
  265 | 
  266 |           // --- Phase 2: Request execution ---
  267 |           // Retry only safe/idempotent methods. Retrying a POST/PUT after a timeout can create
  268 |           // duplicate records and turn a transient blip into a real, confusing failure.
  269 |           const maxAttempts = SAFE_METHODS.has(method) ? MAX_ATTEMPTS_SAFE_METHODS : 1;
  270 |           let response: Awaited<ReturnType<typeof api.call>> | undefined;
  271 | 
  272 |           for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  273 |             try {
  274 |               response = await api.call(method, finalUrl, {
  275 |                 timeout: REQUEST_TIMEOUT_MS,
  276 |                 data: bodyString ?? undefined,
  277 |                 headers,
  278 |               });
  279 |               break;
  280 |             } catch (err: any) {
  281 |               if (attempt === maxAttempts) throw err;
  282 |               console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
  283 |               await new Promise((res) => setTimeout(res, 2000 * attempt));
  284 |             }
  285 |           }
  286 | 
  287 |           // Read the body exactly once and reuse it everywhere below.
  288 |           const rawText = await response!.text();
  289 |           let responseBody: any;
  290 |           let isJson = true;
  291 |           try {
  292 |             responseBody = JSON.parse(rawText);
  293 |           } catch {
  294 |             responseBody = rawText;
  295 |             isJson = false;
  296 |           }
  297 | 
  298 |           await allure.attachment(
  299 |             'Response',
  300 |             JSON.stringify({ status: response!.status(), headers: response!.headers(), body: responseBody }, null, 2),
  301 |             'application/json'
  302 |           );
  303 | 
  304 |           // --- Status assertion ---
  305 |           expect(
  306 |             response!.status(),
  307 |             `Step ${step.STEP_ORDER} "${step.TITLE}" ${method} ${finalUrl} returned unexpected status. Body: ${rawText.slice(0, 1000)}`
  308 |           ).toBe(expectedStatus);
  309 | 
  310 |           // --- Phase 3: Schema validation ---
  311 |           if (step.EXPECTED_SCHEMA) {
  312 |             expect(isJson, `Expected a JSON response for schema validation but got: ${rawText.slice(0, 500)}`).toBe(true);
  313 |             const schema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
  314 |             const result = schema.safeParse(responseBody);
> 315 |             expect(result.success, result.error?.message).toBe(true);
      |                                                           ^ Error: [
  316 |           }
  317 | 
  318 |           // --- Phase 4: State extraction ---
  319 |           if (step.EXTRACT_KEY) {
  320 |             const rules = JSON.parse(step.EXTRACT_KEY) as Record<string, string>;
  321 | 
  322 |             for (const [stateKey, rawPath] of Object.entries(rules)) {
  323 |               let sourceData: any = responseBody;
  324 |               let path = String(rawPath);
  325 | 
  326 |               if (/^(req|request)\./.test(path)) {
  327 |                 sourceData = requestData;
  328 |                 path = path.replace(/^(req|request)\./, '');
  329 |               } else if (/^(res|response)\./.test(path)) {
  330 |                 path = path.replace(/^(res|response)\./, '');
  331 |               }
  332 | 
  333 |               const extracted = getNestedValue(sourceData, path);
  334 | 
  335 |               // A silently-undefined value only surfaces several steps later as a confusing failure.
  336 |               if (extracted === undefined) {
  337 |                 throw new Error(
  338 |                   `Step ${step.STEP_ORDER} "${step.TITLE}": could not extract "${stateKey}" from path "${rawPath}".`
  339 |                 );
  340 |               }
  341 |               testState[stateKey] = extracted;
  342 |             }
  343 |           }
  344 |         });
  345 |       }
  346 |     });
  347 |   }
  348 | });
```