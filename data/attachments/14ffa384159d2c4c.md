# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: BP-PLN PREPAID WORKFLOW 9130
- Location: tests/example.spec.ts:158:9

# Error details

```
SyntaxError: Expected double-quoted property name in JSON at position 1697 (line 62 column 1)
```

# Test source

```ts
  135 |   EXPECTED_STATUS: number;        // Expected HTTP status code (e.g., 200, 404)
  136 | }
  137 | 
  138 | // ==========================================
  139 | // 2. Database Initialization
  140 | // ==========================================
  141 | 
  142 | // Open a read-only connection to the test data database
  143 | const db = new Database('db/TESTDATA.db', { readonly: false });
  144 | 
  145 | // Fetch all distinct test cases. Each row represents a full end-to-end scenario.
  146 | // Cast to IterableIterator to allow looping directly in Playwright's describe block.
  147 | const workflows = db.prepare(`SELECT DISTINCT TEST_CASE_NAME FROM DATA WHERE IS_EXECUTED = '1'`).iterate() as IterableIterator<WorkflowRow>;
  148 | 
  149 | // ==========================================
  150 | // 3. Playwright Test Suite
  151 | // ==========================================
  152 | 
  153 | test.describe('Database-Driven API Workflows', () => {
  154 | 
  155 |   // Dynamically generate a Playwright test for each distinct TEST_CASE_NAME found in the DB
  156 |   for (const workflow of workflows) {
  157 | 
  158 |     test(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async ({ api, baseURL }) => {
  159 |       await allure.epic('Database-Driven API Testing');
  160 |       await allure.feature('Dynamic Workflow Execution');
  161 |       await allure.story(`Scenario: ${workflow.TEST_CASE_NAME}`);
  162 |       await allure.severity('all');
  163 |       await allure.owner('QA Team');
  164 |       await allure.description(`This test executes the API workflow defined in the database for the scenario: ${workflow.TEST_CASE_NAME}.
  165 |       It dynamically constructs requests, validates responses, and extracts state for subsequent steps.`);
  166 |       await allure.link(`${process.env}`, 'Site under test');
  167 | 
  168 |       test.setTimeout(90000);
  169 | 
  170 |       // Fetch all steps for this specific test case, ordered chronologically
  171 |       const steps = db.prepare(
  172 |         'SELECT * FROM DATA WHERE TEST_CASE_NAME = ? ORDER BY STEP_ORDER ASC'
  173 |       ).all(workflow.TEST_CASE_NAME) as StepRow[];
  174 | 
  175 |       // In-memory state store for this specific scenario.
  176 |       // Used to pass data (like auth tokens or generated IDs) from one step to the next.
  177 |       const testState: Record<string, any> = {};
  178 | 
  179 |       for (const step of steps) {
  180 |         await allure.step(`Step ${step.STEP_ORDER}: ${step.TITLE}`, async (ctx) => {
  181 |           await ctx.parameter('Expected status', String(step.EXPECTED_STATUS));
  182 |           // --- Phase 1: Variable Hydration ---
  183 | 
  184 |           let dynamicEndpoint = step.PATH;
  185 |           let dynamicPayload = step.PAYLOAD;
  186 | 
  187 |           // Iterate over current state to replace any {{variableName}} templates in the path or payload
  188 |           // 1. Process testState variables across endpoint and payload
  189 |           for (const [key, value] of Object.entries(testState) as [string, any][]) {
  190 |             const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  191 | 
  192 |             dynamicEndpoint = dynamicEndpoint.replace(
  193 |               new RegExp(`\\{\\{${k}\\}\\}`, 'g'),
  194 |               () => String(value ?? '')
  195 |             );
  196 | 
  197 |             if (dynamicPayload) {
  198 |               // a) bare placeholder (": {{key}}") -> integer, or raw JSON for arrays/objects
  199 |               dynamicPayload = dynamicPayload.replace(
  200 |                 new RegExp(`(:\\s*)\\{\\{${k}\\}\\}`, 'g'),
  201 |                 (_m, prefix) =>
  202 |                   prefix + (value !== null && typeof value === 'object'
  203 |                     ? JSON.stringify(value)
  204 |                     : toJsonInteger(value))
  205 |               );
  206 | 
  207 |               // b) quoted / embedded placeholder ("{{key}}") -> escaped string, zeros kept
  208 |               dynamicPayload = dynamicPayload.replace(
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
> 235 |           const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;
      |                                                     ^ SyntaxError: Expected double-quoted property name in JSON at position 1697 (line 62 column 1)
  236 |           const uniqueSequenceHeader = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string };
  237 | 
  238 |           // 2. Format request payload with JSON stringified data, or switch to ContentType.TEXT
  239 |           const requestPayload = {
  240 |             type: step.TYPE,
  241 |             data: requestData,
  242 |             sequence: uniqueSequenceHeader.SEQUENCE
  243 |           };
  244 | 
  245 |           // Execute the HTTP call with retry logic for transient timeouts
  246 |           let response;
  247 |           let attempt = 1;
  248 |           const maxRetries = 3;
  249 | 
  250 |           while (attempt <= maxRetries) {
  251 |             try {
  252 |               response = await api.call(step.TYPE, finalUrl, {
  253 |                 timeout: 25000, // Increased timeout to 25s for slow server responses
  254 |                 data: requestData,
  255 |                 headers: {
  256 |                   ...headers,
  257 |                   'X-Btn-Key': process.env.API_KEY || '',
  258 |                   'Btn-Reference-Number': `B0250${sequenceNumber}`,
  259 |                   'Btn-User-Id': 'BTN0010042',
  260 |                   'Btn-Terminal-Id': 'PCDIMAS',
  261 |                   'Btn-Terminal-Ip': '10.99.17.134'
  262 |                 }
  263 |               });
  264 |               break; // Break loop if successful
  265 |             } catch (err: any) {
  266 |               if (attempt === maxRetries) throw err;
  267 |               console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
  268 |               await new Promise((res) => setTimeout(res, 2000 * attempt)); // Wait before retry
  269 |               attempt++;
  270 |             }
  271 |           }
  272 | 
  273 |           let responseBody;
  274 |           try {
  275 |             responseBody = await response!.json();
  276 |           } catch (e) {
  277 |             responseBody = await response!.text();
  278 |           }
  279 | 
  280 |           const responseContent = JSON.stringify({
  281 |             status: response!.status(),
  282 |             headers: response!.headers(),
  283 |             body: responseBody
  284 |           }, null, 2);
  285 | 
  286 | 
  287 |           db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run(); // Increment sequence for next use
  288 | 
  289 |           //console.log(`Step: ${step.TITLE } | Endpoint: ${finalUrl} | Status: ${response.status()} | Request Body: ${dynamicPayload || 'N/A'} | Response Body: ${await response.text()}`);
  290 | 
  291 |           // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
  292 |           expect(response!.status()).toBe(step.EXPECTED_STATUS);
  293 | 
  294 |           // --- Phase 3: Schema Validation ---
  295 | 
  296 |           if (step.EXPECTED_SCHEMA) {
  297 |             // Convert the stringified expected schema from the DB into an active validation schema (e.g., Zod)
  298 |             const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
  299 | 
  300 |             // Parse response body if request succeeded, otherwise validate an empty object
  301 |             const validationResult = InferredSchema.safeParse(await response!.json());
  302 | 
  303 |             // Assert schema validity. If it fails, Playwright will log validationResult.error?.message
  304 |             expect(validationResult.success, validationResult.error?.message).toBe(true);
  305 |           }
  306 |           // --- Phase 4: State Extraction ---
  307 | 
  308 |           // If the database tells us to extract values from this response for future steps
  309 |           if (step.EXTRACT_KEY) {
  310 |             const body = await response!.json();
  311 |             const rules = JSON.parse(step.EXTRACT_KEY);
  312 | 
  313 |             for (const [stateKey, responsePath] of Object.entries(rules)) {
  314 |               let sourceData = body;
  315 |               let path = responsePath as string;
  316 | 
  317 |               // Direct extraction from request payload
  318 |               if (path.startsWith('req.') || path.startsWith('request.')) {
  319 |                 sourceData = requestData; // Pass the request body object here
  320 |                 path = path.replace(/^(req|request)\./, '');
  321 |               } else if (path.startsWith('res.') || path.startsWith('response.')) {
  322 |                 path = path.replace(/^(res|response)\./, '');
  323 |               }
  324 | 
  325 |               const extractedValue = getNestedValue(sourceData, path);
  326 |               testState[stateKey] = extractedValue;
  327 |             }
  328 |           }
  329 |         });
  330 |       }
  331 |     });
  332 |   }
  333 | });
```