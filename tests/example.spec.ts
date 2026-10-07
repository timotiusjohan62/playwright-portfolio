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
import { getSignedHeaders } from '../utils/signatureGenerator';
import { string } from 'zod';

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

/**
 * Strips port numbers/prefixes from path strings specifically for HMAC signatures.
 * Example: ":7095/bp/bpjs" -> "/bp/bpjs"
 * Example: "/:7095/bp/bpjs" -> "/bp/bpjs"
 */
const cleanPathForSignature = (rawPath: string): string => {
  let path = rawPath.trim();
  path = path.replace(/^https?:\/\/[^\/]+/, '');
  path = path.replace(/^(\/?:\d+|\d+)\//, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  return path;
};

/**
 * Resolves DB endpoints containing port prefixes (e.g., ":7095/bp/bpjs") into a fully qualified
 * request URL using Playwright's config `baseURL` host while preserving the specified port.
 * Example: ":7095/bp/bpjs" + baseURL ("http://172.18.30.26:7084") -> "http://172.18.30.26:7095/bp/bpjs"
 */
const resolveFetchEndpoint = (rawPath: string, configBaseUrl?: string): string => {
  let path = rawPath.trim();

  // 1. If path is already a complete HTTP/HTTPS URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 2. Extract port prefix from paths like ":7095/bp/bpjs" or "/:7095/bp/bpjs"
  const portMatch = path.match(/^\/?:(\d+)/);
  const explicitPort = portMatch ? portMatch[1] : null;

  // 3. Clean path to standard relative format (e.g. "/bp/bpjs")
  const cleanPath = cleanPathForSignature(path);

  // 4. Resolve base host (e.g. "http://172.18.30.26")
  const defaultBase = configBaseUrl || process.env.BASE_URL || 'http://172.18.30.26';
  const urlObj = new URL(defaultBase);

  // If DB endpoint defines a port (e.g., 7095), override the host's default port
  if (explicitPort) {
    urlObj.port = explicitPort;
  }

  return new URL(cleanPath, urlObj.origin).toString();
};

/**
 * Generates signed headers using a clean, port-free path string.
 */
const getSignedHeadersForStep = (
  type: string,
  path: string,
  payload: string | null
): Record<string, string> => {
  const cleanSignaturePath = cleanPathForSignature(path);
  return getSignedHeaders(type, cleanSignaturePath, payload);
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
const db = new Database('db/TESTDATA.db', { readonly: false });

// Fetch all distinct test cases. Each row represents a full end-to-end scenario.
// Cast to IterableIterator to allow looping directly in Playwright's describe block.
const workflows = db.prepare('SELECT DISTINCT TEST_CASE_NAME FROM DATA').iterate() as IterableIterator<WorkflowRow>;

// ==========================================
// 3. Playwright Test Suite
// ==========================================

test.describe('Database-Driven API Workflows', () => {

  // Dynamically generate a Playwright test for each distinct TEST_CASE_NAME found in the DB
  for (const workflow of workflows) {

    test(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async ({ request, baseURL }) => {

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
            if (dynamicPayload.includes('{{sequence}}')) {
              const uniqueSequence = db.prepare('SELECT SEQUENCE FROM UTILS').get() as {SEQUENCE?: string };
              dynamicPayload = dynamicPayload.replace(/{{sequence}}/g, uniqueSequence.SEQUENCE || '');
              db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run(); // Increment sequence for next use
            }
            // Replaces instances of {{variable}} in the stringified JSON payload
            // Note: Ensures value is cast to a string to prevent regex type errors
            dynamicPayload = dynamicPayload.replace(regex, String(value));
          }
        }

        // Header Construction ---
        const headers = getSignedHeadersForStep(step.TYPE, dynamicEndpoint, dynamicPayload);

        // Fix potential port/host syntax malformations (e.g., http://172.18.30.26/:7084/...)
        const finalUrl = resolveFetchEndpoint(dynamicEndpoint, baseURL);

        // --- Phase 2: Request Execution ---

        // Safely parse the hydrated payload back to a JSON object for the Playwright request
        const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;

        // Execute the HTTP call using Playwright's API request context
        const response = await request.fetch(finalUrl, {
          method: step.TYPE,
          data: requestData,
          headers: {
            ...headers,
            'X-Btn-Key': process.env.API_KEY || '', // Ensure API key is included in headers
            'Btn-Reference-Number': 'B02506510001',
            'Btn-User-Id': 'BTN0010042',
            'Btn-Terminal-Id': 'PCDIMAS',
            'Btn-Terminal-Ip': '10.99.17.134'
          }
        });

        console.log(`Step: ${step.TITLE } | Endpoint: ${finalUrl} | Status: ${response.status()} | Request Body: ${dynamicPayload || 'N/A'} | Response Body: ${await response.text()}`);

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