/**
 * Database-Driven API Testing Framework
 * 
 * This script runs automated API tests driven entirely by a SQLite database.
 * It dynamically constructs requests, substitutes variables stored in state from previous steps,
 * validates HTTP status codes, verifies response payloads against dynamically generated Zod schemas,
 * and extracts data from responses to be used in subsequent requests.
 */
import Database from 'better-sqlite3';
import { assertSchema, generateDynamicSchema } from '../utils/schemaInferrer';
import { buildHeaders } from '../utils/headerHelper';
import { test, expect, allure, expectStatus } from '../fixtures/base';

/**
 * Utility to extract deeply nested values from a JSON object using a dot-notation string path.
 * 
 * @param obj - The JSON object to search (usually the API response body)
 * @param path - The dot-notation path (e.g., 'data.user.id')
 * @returns The value at the specified path, or undefined if the path doesn't exist
 */

/** Replace {{vars}} using state; fail loudly if any placeholder is left unresolved. */
function hydrate(text: string, state: Record<string, string>, stepTitle: string): string {
  let out = text;
  for (const [k, v] of Object.entries(state)) out = out.split(`{{${k}}}`).join(v);
  const missing = out.match(/{{\s*[\w.-]+\s*}}/g);
  if (missing) {
    throw new Error(`Unresolved variable(s) ${[...new Set(missing)].join(', ')} in step "${stepTitle}"`);
  }
  return out;
}


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

    test(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async ({ api }) => {
      await allure.epic('Database-Driven API Testing');
      await allure.feature('Dynamic Workflow Execution');
      await allure.story(`Scenario: ${workflow.TEST_CASE_NAME}`);
      await allure.severity('all');
      await allure.owner('QA Team');
      await allure.description(`This test executes the API workflow defined in the database for the scenario: ${workflow.TEST_CASE_NAME}.
      It dynamically constructs requests, validates responses, and extracts state for subsequent steps.`);
      await allure.link('https://api.escuelajs.co', 'Site under test');

      // Fetch all steps for this specific test case, ordered chronologically
      const steps = db.prepare(
        'SELECT * FROM DATA WHERE TEST_CASE_NAME = ? ORDER BY STEP_ORDER ASC'
      ).all(workflow.TEST_CASE_NAME) as StepRow[];

      // In-memory state store for this specific scenario.
      // Used to pass data (like auth tokens or generated IDs) from one step to the next.
      const testState: Record<string, string> = {};

      for (const step of steps) {
        await allure.step(`Step ${step.STEP_ORDER}: ${step.TITLE}`, async (ctx) => {
          await ctx.parameter('Expected status', String(step.EXPECTED_STATUS));


          // --- Phase 0: Header Construction ---
          const headers = buildHeaders({
            customHeaders: step.EXTRACT_KEY ? JSON.stringify(testState) : undefined
          });

          // --- Phase 1: Variable Hydration ---

          const endpoint = hydrate(step.PATH, testState, step.TITLE);
          const payload = step.PAYLOAD ? hydrate(step.PAYLOAD, testState, step.TITLE) : undefined;

          // --- Phase 2: Request Execution ---

          // Safely parse the hydrated payload back to a JSON object for the Playwright request
          // Logged with full request/response detail
          const response = await api.call(step.TYPE, endpoint, {
            data: payload ? JSON.parse(payload) : undefined,
            headers,
          });

          // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
          expectStatus(response, step.EXPECTED_STATUS);

          // --- Phase 3: Schema Validation ---

          const body = step.EXPECTED_SCHEMA || step.EXTRACT_KEY ? await response.json() : undefined;

          if (step.EXPECTED_SCHEMA) {
            const schema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
            assertSchema(schema, body, `Schema validation failed for step: ${step.TITLE}`);
          }

          if (step.EXTRACT_KEY) {
            const rules = JSON.parse(step.EXTRACT_KEY);
            for (const [stateKey, responsePath] of Object.entries(rules)) {
              const value = getNestedValue(body, responsePath as string);
              if (value === undefined) {
                throw new Error(`Extract failed: "${responsePath}" not found in response of "${step.TITLE}"`);
              }
              testState[stateKey] = String(value);
            }
          }
        });
      }
    });
  }
});