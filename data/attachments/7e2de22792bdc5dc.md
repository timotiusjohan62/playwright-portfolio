# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: BP-UTBK WORKSFLOW - 9142
- Location: tests/example.spec.ts:152:9

# Error details

```
Error: [
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "responseBiller"
    ],
    "message": "Invalid input: expected object, received undefined"
  }
]

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  181 |           // Iterate over current state to replace any {{variableName}} templates in the path or payload
  182 |           // 1. Process testState variables across endpoint and payload
  183 |           for (const [key, value] of Object.entries(testState)) {
  184 |             const regex = new RegExp(`{{${key}}}`, 'g');
  185 |             dynamicEndpoint = dynamicEndpoint.replace(regex, value);
  186 | 
  187 |             if (dynamicPayload) {
  188 |               dynamicPayload = dynamicPayload.replace(regex, String(value));
  189 |             }
  190 |           }
  191 | 
  192 |           const sequenceNumber = getNextSequence();
  193 | 
  194 |           // 2. Handle DB Sequence once outside the loop
  195 |           if (dynamicPayload && dynamicPayload.includes('{{sequence}}')) {
  196 |             const uniqueSequence = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string | number };
  197 |             const seqValue = uniqueSequence?.SEQUENCE ?? 0;
  198 | 
  199 |             dynamicPayload = dynamicPayload.replace(/{{sequence}}/g, String(seqValue));
  200 |             db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run();
  201 |           }
  202 | 
  203 |           // Header Construction
  204 |           const headers = getSignedHeadersForStep(step.TYPE, dynamicEndpoint, dynamicPayload);
  205 | 
  206 |           // Fix potential port/host syntax malformations
  207 |           const finalUrl = resolveFetchEndpoint(dynamicEndpoint, baseURL);
  208 | 
  209 |           // --- Phase 2: Request Execution ---
  210 | 
  211 |           // Safely parse payload back to JSON object
  212 |           const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;
  213 |           const uniqueSequenceHeader = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string };
  214 | 
  215 |           // 2. Format request payload with JSON stringified data, or switch to ContentType.TEXT
  216 |           const requestPayload = {
  217 |             type: step.TYPE,
  218 |             data: requestData,
  219 |             sequence: uniqueSequenceHeader.SEQUENCE
  220 |           };
  221 | 
  222 |           // Execute the HTTP call with retry logic for transient timeouts
  223 |           let response;
  224 |           let attempt = 1;
  225 |           const maxRetries = 3;
  226 | 
  227 |           while (attempt <= maxRetries) {
  228 |             try {
  229 |               response = await api.call(step.TYPE, finalUrl, {
  230 |                 timeout: 25000, // Increased timeout to 25s for slow server responses
  231 |                 data: requestData,
  232 |                 headers: {
  233 |                   ...headers,
  234 |                   'X-Btn-Key': process.env.API_KEY || '',
  235 |                   'Btn-Reference-Number': `B0250${sequenceNumber}`,
  236 |                   'Btn-User-Id': 'BTN0010042',
  237 |                   'Btn-Terminal-Id': 'PCDIMAS',
  238 |                   'Btn-Terminal-Ip': '10.99.17.134'
  239 |                 }
  240 |               });
  241 |               break; // Break loop if successful
  242 |             } catch (err: any) {
  243 |               if (attempt === maxRetries) throw err;
  244 |               console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
  245 |               await new Promise((res) => setTimeout(res, 2000 * attempt)); // Wait before retry
  246 |               attempt++;
  247 |             }
  248 |           }
  249 | 
  250 |           let responseBody;
  251 |           try {
  252 |             responseBody = await response!.json();
  253 |           } catch (e) {
  254 |             responseBody = await response!.text();
  255 |           }
  256 | 
  257 |           const responseContent = JSON.stringify({
  258 |             status: response!.status(),
  259 |             headers: response!.headers(),
  260 |             body: responseBody
  261 |           }, null, 2);
  262 | 
  263 | 
  264 |           db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run(); // Increment sequence for next use
  265 | 
  266 |           //console.log(`Step: ${step.TITLE } | Endpoint: ${finalUrl} | Status: ${response.status()} | Request Body: ${dynamicPayload || 'N/A'} | Response Body: ${await response.text()}`);
  267 | 
  268 |           // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
  269 |           expect(response!.status()).toBe(step.EXPECTED_STATUS);
  270 | 
  271 |           // --- Phase 3: Schema Validation ---
  272 | 
  273 |           if (step.EXPECTED_SCHEMA) {
  274 |             // Convert the stringified expected schema from the DB into an active validation schema (e.g., Zod)
  275 |             const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
  276 | 
  277 |             // Parse response body if request succeeded, otherwise validate an empty object
  278 |             const validationResult = InferredSchema.safeParse(await response!.json());
  279 | 
  280 |             // Assert schema validity. If it fails, Playwright will log validationResult.error?.message
> 281 |             expect(validationResult.success, validationResult.error?.message).toBe(true);
      |                                                                               ^ Error: [
  282 |           }
  283 |           // --- Phase 4: State Extraction ---
  284 | 
  285 |           // If the database tells us to extract values from this response for future steps
  286 |           if (step.EXTRACT_KEY) {
  287 |             const body = await response!.json();
  288 |             const rules = JSON.parse(step.EXTRACT_KEY);
  289 | 
  290 |             for (const [stateKey, responsePath] of Object.entries(rules)) {
  291 |               let sourceData = body;
  292 |               let path = responsePath as string;
  293 | 
  294 |               // Direct extraction from request payload
  295 |               if (path.startsWith('req.') || path.startsWith('request.')) {
  296 |                 sourceData = requestData; // Pass the request body object here
  297 |                 path = path.replace(/^(req|request)\./, '');
  298 |               } else if (path.startsWith('res.') || path.startsWith('response.')) {
  299 |                 path = path.replace(/^(res|response)\./, '');
  300 |               }
  301 | 
  302 |               const extractedValue = getNestedValue(sourceData, path);
  303 |               testState[stateKey] = extractedValue;
  304 |             }
  305 |           }
  306 |         });
  307 |       }
  308 |     });
  309 |   }
  310 | });
```