import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import { generateDynamicSchema } from '../utils/schemaInferrer';

// Helper function to extract nested JSON paths (e.g., 'user.id' -> body.user.id)
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// 1. Define types based on your SQLite schema
interface WorkflowRow {
  TEST_CASE_NAME: string;
}

interface StepRow {
  ID: number;
  TEST_CASE_NAME: string;
  TITLE: string;
  STEP_ORDER: number;
  TYPE: string; // Assuming this holds HTTP methods like 'GET', 'POST'
  PATH: string;
  PAYLOAD: string | null;
  EXTRACT_KEY: string | null;
  EXPECTED_SCHEMA: string | null;
  EXPECTED_STATUS: number;
}

// 2. Open connection
const db = new Database('db/TESTDATA.db', { readonly: true });

// 3. Cast the iterate() result to an IterableIterator of your type
const workflows = db.prepare('SELECT DISTINCT TEST_CASE_NAME FROM DATA').iterate() as IterableIterator<WorkflowRow>;

test.describe('Database-Driven API Workflows', () => {

  for (const workflow of workflows) {

    // Use workflow.TEST_CASE_NAME instead of workflow.scenario_name
    test(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async ({ request }) => {

      // 4. Update the inner query to use your actual 'DATA' table and cast the result
      const steps = db.prepare(
        'SELECT * FROM DATA WHERE TEST_CASE_NAME = ? ORDER BY STEP_ORDER ASC'
      ).all(workflow.TEST_CASE_NAME) as StepRow[];

      const testState: Record<string, string> = {};

      for (const step of steps) {
        // 1. Variable Replacement
        let dynamicEndpoint = step.PATH;
        let dynamicPayload = step.PAYLOAD;
        console.log('Base URL loaded as:', process.env.API_BASE_URL);
        for (const [key, value] of Object.entries(testState)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          dynamicEndpoint = dynamicEndpoint.replace(regex, value);
          if (dynamicPayload) {
            // Replace variables in payload (e.g. {{newCategory}}) before JSON parsing
            dynamicPayload = dynamicPayload.replace(regex, String(value));
          }
        }

        // 2. Execute Request
        const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;
        const response = await request.fetch(dynamicEndpoint, {
          method: step.TYPE,
          data: requestData
        });

        console.log(`Step: ${step.TITLE}, request: ${step.TYPE} ${dynamicEndpoint}, payload: ${dynamicPayload}, status: ${response.status()}, response: ${await response.text()}`);

        expect(response.status()).toBe(step.EXPECTED_STATUS);

        // 3. Schema Validation
        if (!step.EXPECTED_SCHEMA) {
          console.warn(`No EXPECTED_SCHEMA defined for step: ${step.TITLE}`);
          continue;
        }

        const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));

        const validationResult = InferredSchema.safeParse(response.ok() ? await response.json() : {});

        // If live API returns a string for "total" instead of a number, Zod will flag it
        expect(validationResult.success, validationResult.error?.message).toBe(true);

        // 3. MULTI-FIELD EXTRACTION LOGIC
        if (step.EXTRACT_KEY) {
          const body = await response.json();

          // Parse the JSON rules from SQLite (e.g., {"authToken": "token", "userId": "user.id"})
          const rules = JSON.parse(step.EXTRACT_KEY);
          // Loop through every rule and save it to the global testState
          for (const [stateKey, responsePath] of Object.entries(rules)) {

            // Use our helper to grab the value, even if it's nested
            const extractedValue = getNestedValue(body, responsePath as string);

            // Save it to state so the next steps can use it!
            testState[stateKey] = extractedValue;

            console.log(`Extracted ${stateKey}:`, extractedValue);
          }
        }
      }
    });
  }
});