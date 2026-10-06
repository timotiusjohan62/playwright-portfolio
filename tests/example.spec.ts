/**
 * Database-Driven API Testing Framework
 * 
 * This script runs automated API tests driven entirely by a SQLite database.
 * It dynamically constructs requests, substitutes variables stored in state from previous steps,
 * validates HTTP status codes, verifies response payloads against dynamically generated Zod schemas,
 * and extracts data from responses to be used in subsequent requests.
 */

import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import { generateDynamicSchema } from '../utils/schemaInferrer';

/**
 * Utility to extract deeply nested values from a JSON object using a dot-notation string path.
 * 
 * @param obj - The JSON object to search (usually the API response body)
 * @param path - The dot-notation path (e.g., 'data.user.id')
 * @returns The value at the specified path, or undefined if the path doesn't exist
 */
const getNestedValue = (obj: any, path: any) => {
  // 1. Safeguard: If path is missing or null, return undefined safely
  if (!path) return undefined;

  // 2. Coerce path to a string just in case SQLite returned a number or object
  const stringPath = typeof path === 'string' ? path : String(path);

  // 3. Now .split() is guaranteed to work safely
  return stringPath.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// ==========================================
// 1. Database Typings
// ==========================================

// Represents a unique workflow (test case) grouping multiple API steps
interface WorkflowRow {
  TEST_CASE_NAME: string;
}

// Represents a single API execution step within a workflow
interface StepRow {
  ID: number;
  TEST_CASE_NAME: string;
  TITLE: string;
  STEP_ORDER: number;     // Determines execution sequence within a workflow
  TYPE: string;           // HTTP Method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
  PATH: string;           // The API endpoint URL (can contain {{variables}})
  PAYLOAD: string | null; // The JSON request body stringified (can contain {{variables}})
  EXTRACT_KEY: string | null;     // JSON map of { "stateKey": "json.path.to.extract" }
  EXPECTED_SCHEMA: string | null; // JSON representation of the expected response schema 
  EXPECTED_STATUS: number;        // Expected HTTP status code (e.g., 200, 404)
}

// ==========================================
// 2. Database Initialization
// ==========================================

// Open a read-only connection to the test data database
const db = new Database('db/TESTDATA.db', { readonly: true });

// Fetch all distinct test cases. Each row represents a full end-to-end scenario.
// Cast to IterableIterator to allow looping directly in Playwright's describe block.
const workflows = db.prepare('SELECT DISTINCT TEST_CASE_NAME FROM DATA').iterate() as IterableIterator<WorkflowRow>;

// ==========================================
// 3. Playwright Test Suite
// ==========================================

test.describe('Database-Driven API Workflows', () => {

  // Dynamically generate a Playwright test for each distinct TEST_CASE_NAME found in the DB
  for (const workflow of workflows) {

    test(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async ({ request }) => {

      // Fetch all steps for this specific test case, ordered chronologically
      const steps = db.prepare(
        'SELECT * FROM DATA WHERE TEST_CASE_NAME = ? ORDER BY STEP_ORDER ASC'
      ).all(workflow.TEST_CASE_NAME) as StepRow[];

      // In-memory state store for this specific scenario.
      // Used to pass data (like auth tokens or generated IDs) from one step to the next.
      const testState: Record<string, string> = {};

      for (const step of steps) {

        // --- Phase 1: Variable Hydration ---

        let dynamicEndpoint = step.PATH;
        let dynamicPayload = step.PAYLOAD;

        // Iterate over current state to replace any {{variableName}} templates in the path or payload
        for (const [key, value] of Object.entries(testState)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          dynamicEndpoint = dynamicEndpoint.replace(regex, value);

          if (dynamicPayload) {
            // Replaces instances of {{variable}} in the stringified JSON payload
            // Note: Ensures value is cast to a string to prevent regex type errors
            dynamicPayload = dynamicPayload.replace(regex, String(value));
          }
        }

        // --- Phase 2: Request Execution ---

        // Safely parse the hydrated payload back to a JSON object for the Playwright request
        const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;

        // Execute the HTTP call using Playwright's API request context
        const response = await request.fetch(dynamicEndpoint, {
          method: step.TYPE,
          data: requestData
        });

        console.log(`Step: ${step.TITLE} | response: ${await response.text()} \n\n`);



        // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
        expect(response.status()).toBe(step.EXPECTED_STATUS);

        // --- Phase 3: Schema Validation ---

        if (!step.EXPECTED_SCHEMA) {
          continue; // Skip validation if no schema is provided
        }

        // Convert the stringified expected schema from the DB into an active validation schema (e.g., Zod)
        const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));

        // Parse response body if request succeeded, otherwise validate an empty object
        const validationResult = InferredSchema.safeParse(await response.json());

        // Assert schema validity. If it fails, Playwright will log validationResult.error?.message
        expect(validationResult.success, validationResult.error?.message).toBe(true);

        // --- Phase 4: State Extraction ---

        // If the database tells us to extract values from this response for future steps
        if (step.EXTRACT_KEY) {
          const body = await response.json();

          // Parse the extraction mapping (e.g., {"userToken": "auth.token", "newUserId": "data.id"})
          const rules = JSON.parse(step.EXTRACT_KEY);

          // Loop through the extraction rules
          for (const [stateKey, responsePath] of Object.entries(rules)) {

            // Extract the data using dot-notation string
            const extractedValue = getNestedValue(body, responsePath as string);

            // Store it in the testState object so subsequent iterations of the loop can access it via {{stateKey}}
            testState[stateKey] = extractedValue;
          }
        }
      }
    });
  }
});