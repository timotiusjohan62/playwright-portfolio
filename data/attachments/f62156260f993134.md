# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: CIF Maintenance Workflow-institution cif
- Location: tests/example.spec.ts:158:9

# Error details

```
Error: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      0,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      0,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      0,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      1,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      1,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      1,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      2,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      2,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      2,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      3,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      3,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      3,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      4,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      4,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      4,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      5,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      5,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      5,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      6,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      6,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      6,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      7,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      7,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      7,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      8,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      8,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      8,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      9,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      9,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      9,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      10,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      10,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      10,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      11,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      11,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      11,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      12,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      12,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      12,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      13,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      13,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      13,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      14,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      14,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      14,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      15,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      15,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      15,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      16,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      16,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      16,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      17,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      17,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      17,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      18,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      18,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      18,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      19,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      19,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      19,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      20,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      20,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      20,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      21,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      21,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      21,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      22,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      22,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      22,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      23,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      23,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      23,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      24,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      24,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      24,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      25,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      25,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      25,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      26,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      26,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      26,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      27,
      "departementIdFunding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      27,
      "divisionIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation",
      27,
      "departementIdLanding"
    ],
    "message": "Invalid input: expected string, received undefined"
  }
]

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  209 |                 new RegExp(`\\{\\{${k}\\}\\}`, 'g'),
  210 |                 () => JSON.stringify(String(value ?? '')).slice(1, -1)
  211 |               );
  212 |             }
  213 |           }
  214 | 
  215 |           const sequenceNumber = getNextSequence();
  216 | 
  217 |           // 2. Handle DB Sequence once outside the loop
  218 |           if (dynamicPayload && dynamicPayload.includes('{{sequence}}')) {
  219 |             const uniqueSequence = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string | number };
  220 |             const seqValue = uniqueSequence?.SEQUENCE ?? 0;
  221 | 
  222 |             dynamicPayload = dynamicPayload.replace(/{{sequence}}/g, String(seqValue));
  223 |             db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run();
  224 |           }
  225 | 
  226 |           // Header Construction
  227 |           const headers = getSignedHeadersForStep(step.TYPE, dynamicEndpoint, dynamicPayload);
  228 | 
  229 |           // Fix potential port/host syntax malformations
  230 |           const finalUrl = resolveFetchEndpoint(dynamicEndpoint, baseURL);
  231 | 
  232 |           // --- Phase 2: Request Execution ---
  233 | 
  234 |           // Safely parse payload back to JSON object
  235 |           let requestData;
  236 |           try {
  237 |             requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;
  238 |           } catch (e: any) {
  239 |             throw new Error(`Invalid JSON payload for "${step.TITLE}": ${e.message}\n${dynamicPayload}`);
  240 |           }
  241 |           const uniqueSequenceHeader = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string };
  242 | 
  243 |           // 2. Format request payload with JSON stringified data, or switch to ContentType.TEXT
  244 |           const requestPayload = {
  245 |             type: step.TYPE,
  246 |             data: requestData,
  247 |             sequence: uniqueSequenceHeader.SEQUENCE
  248 |           };
  249 | 
  250 |           // Execute the HTTP call with retry logic for transient timeouts
  251 |           let response;
  252 |           let attempt = 1;
  253 |           const maxRetries = 3;
  254 | 
  255 |           while (attempt <= maxRetries) {
  256 |             try {
  257 |               response = await api.call(step.TYPE, finalUrl, {
  258 |                 timeout: 25000, // Increased timeout to 25s for slow server responses
  259 |                 data: requestData,
  260 |                 headers: {
  261 |                   ...headers,
  262 |                   'X-Btn-Key': process.env.API_KEY || '',
  263 |                   'Btn-Reference-Number': `B0250${sequenceNumber}`,
  264 |                   'Btn-User-Id': 'BTN0010042',
  265 |                   'Btn-Terminal-Id': 'PCDIMAS',
  266 |                   'Btn-Terminal-Ip': '10.99.17.134'
  267 |                 }
  268 |               });
  269 |               break; // Break loop if successful
  270 |             } catch (err: any) {
  271 |               if (attempt === maxRetries) throw err;
  272 |               console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
  273 |               await new Promise((res) => setTimeout(res, 2000 * attempt)); // Wait before retry
  274 |               attempt++;
  275 |             }
  276 |           }
  277 | 
  278 |           let responseBody;
  279 |           try {
  280 |             responseBody = await response!.json();
  281 |           } catch (e) {
  282 |             responseBody = await response!.text();
  283 |           }
  284 | 
  285 |           const responseContent = JSON.stringify({
  286 |             status: response!.status(),
  287 |             headers: response!.headers(),
  288 |             body: responseBody
  289 |           }, null, 2);
  290 | 
  291 | 
  292 |           db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run(); // Increment sequence for next use
  293 | 
  294 |           //console.log(`Step: ${step.TITLE } | Endpoint: ${finalUrl} | Status: ${response.status()} | Request Body: ${dynamicPayload || 'N/A'} | Response Body: ${await response.text()}`);
  295 | 
  296 |           // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
  297 |           expect(response!.status()).toBe(step.EXPECTED_STATUS);
  298 | 
  299 |           // --- Phase 3: Schema Validation ---
  300 | 
  301 |           if (step.EXPECTED_SCHEMA) {
  302 |             // Convert the stringified expected schema from the DB into an active validation schema (e.g., Zod)
  303 |             const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
  304 | 
  305 |             // Parse response body if request succeeded, otherwise validate an empty object
  306 |             const validationResult = InferredSchema.safeParse(await response!.json());
  307 | 
  308 |             // Assert schema validity. If it fails, Playwright will log validationResult.error?.message
> 309 |             expect(validationResult.success, validationResult.error?.message).toBe(true);
      |                                                                               ^ Error: [
  310 |           }
  311 |           // --- Phase 4: State Extraction ---
  312 | 
  313 |           // If the database tells us to extract values from this response for future steps
  314 |           if (step.EXTRACT_KEY) {
  315 |             const body = await response!.json();
  316 |             const rules = JSON.parse(step.EXTRACT_KEY);
  317 | 
  318 |             for (const [stateKey, responsePath] of Object.entries(rules)) {
  319 |               let sourceData = body;
  320 |               let path = responsePath as string;
  321 | 
  322 |               // Direct extraction from request payload
  323 |               if (path.startsWith('req.') || path.startsWith('request.')) {
  324 |                 sourceData = requestData; // Pass the request body object here
  325 |                 path = path.replace(/^(req|request)\./, '');
  326 |               } else if (path.startsWith('res.') || path.startsWith('response.')) {
  327 |                 path = path.replace(/^(res|response)\./, '');
  328 |               }
  329 | 
  330 |               const extractedValue = getNestedValue(sourceData, path);
  331 |               testState[stateKey] = extractedValue;
  332 |             }
  333 |           }
  334 |         });
  335 |       }
  336 |     });
  337 |   }
  338 | });
```