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
import * as allure from 'allure-js-commons';

/**
 * Utility to extract deeply nested values from a JSON object using a dot-notation string path.
 * 
 * @param obj The JSON object to search (usually the API response body)
 * @param path The dot-notation path (e.g., 'data.user.id')
 * @returns The value at the specified path, or undefined if the path doesn't exist
 */
const getNestedValue = (obj: any, path: any) => {
  if (!path) return undefined;
  const stringPath = typeof path === 'string' ? path : String(path);
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
 */
const resolveFetchEndpoint = (rawPath: string, configBaseUrl?: string): string => {
  let path = rawPath.trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const portMatch = path.match(/^\/?:(\d+)/);
  const explicitPort = portMatch ? portMatch[1] : null;
  const cleanPath = cleanPathForSignature(path);
  const defaultBase = configBaseUrl || process.env.BASE_URL || 'http://172.18.30.26';
  const urlObj = new URL(defaultBase);

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

/**
 * Utility to split an array of workflows into controlled chunks (batches)
 * to prevent server-side rate-limiting and timeouts under high concurrency.
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// ==========================================
// 1. Database Typings
// ==========================================

interface WorkflowRow {
  TEST_CASE_NAME: string;
}

interface StepRow {
  ID: number;
  TEST_CASE_NAME: string;
  TITLE: string;
  STEP_ORDER: number;
  TYPE: string;
  PATH: string;
  PAYLOAD: string | null;
  EXTRACT_KEY: string | null;
  EXPECTED_SCHEMA: string | null;
  EXPECTED_STATUS: number;
}

// ==========================================
// 2. Database Initialization & Concurrency Safety
// ==========================================

const db = new Database('db/TESTDATA.db', { readonly: false });

// Enable WAL mode and a 5-second busy timeout so workers wait instead of crashing with 'database is locked'
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');

/**
 * Safely fetches and increments the sequence atomically using an exclusive transaction
 * with built-in retry handling for heavy parallel execution.
 */
const getNextSequence = () => {
  const updateSeq = db.transaction(() => {
    const row = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: number };
    const currentSeq = row?.SEQUENCE ?? 0;
    db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run();
    return currentSeq;
  });

  try {
    return updateSeq();
  } catch (err) {
    // Fallback pseudo-random unique number if lock persists briefly
    return Date.now().toString().slice(-6);
  }
};

// Fetch all distinct test cases as an array so we can chunk them
const workflows = db.prepare(`SELECT DISTINCT TEST_CASE_NAME FROM DATA WHERE IS_EXECUTED = '1'`).all() as WorkflowRow[];

// Define chunk size (reduced to 5 to protect server from timeouts under heavy load)
const WORKFLOW_BATCH_SIZE = 5;
const workflowBatches = chunkArray(workflows, WORKFLOW_BATCH_SIZE);

// ==========================================
// 3. Playwright Test Suite
// ==========================================

test.describe('Database-Driven API Workflows', () => {

  for (const [batchIndex, batchWorkflows] of workflowBatches.entries()) {

    for (const workflow of batchWorkflows) {

      test(`Executes scenario: ${workflow.TEST_CASE_NAME} [Batch ${batchIndex + 1}]`, async ({ request, baseURL }) => {
        test.setTimeout(90000);

        const steps = db.prepare(
          'SELECT * FROM DATA WHERE TEST_CASE_NAME = ? ORDER BY STEP_ORDER ASC'
        ).all(workflow.TEST_CASE_NAME) as StepRow[];

        const testState: Record<string, string> = {};

        await allure.step(`Executes scenario: ${workflow.TEST_CASE_NAME}`, async () => {
          for (const step of steps) {
            await allure.epic(`${step.TEST_CASE_NAME}`);
            await allure.feature(`${step.TEST_CASE_NAME}`);
            await allure.story(`${step.TITLE}`);
            
            let dynamicEndpoint = step.PATH;
            let dynamicPayload = step.PAYLOAD;

            for (const [key, value] of Object.entries(testState)) {
              const regex = new RegExp(`{{${key}}}`, 'g');
              dynamicEndpoint = dynamicEndpoint.replace(regex, value);

              if (dynamicPayload) {
                dynamicPayload = dynamicPayload.replace(regex, String(value));
              }
            }

            const sequenceNumber = getNextSequence();

            if (dynamicPayload && dynamicPayload.includes('{{sequence}}')) {
              dynamicPayload = dynamicPayload.replace(/{{sequence}}/g, String(sequenceNumber));
            }

            const headers = getSignedHeadersForStep(step.TYPE, dynamicEndpoint, dynamicPayload);
            const finalUrl = resolveFetchEndpoint(dynamicEndpoint, baseURL);

            const requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;

            const requestPayload = {
              type: step.TYPE,
              data: requestData,
              sequence: sequenceNumber
            };

            await allure.attachment(
              `REQUEST: ${step.TEST_CASE_NAME}`,
              JSON.stringify(requestPayload, null, 2),
              allure.ContentType.JSON
            );

            // Execute the HTTP call with retry logic for transient timeouts
            let response;
            let attempt = 1;
            const maxRetries = 3;

            while (attempt <= maxRetries) {
              try {
                response = await request.fetch(finalUrl, {
                  timeout: 25000, // Increased timeout to 25s for slow server responses
                  method: step.TYPE,
                  data: requestData,
                  headers: {
                    ...headers,
                    'X-Btn-Key': process.env.API_KEY || '',
                    'Btn-Reference-Number': `B0250${sequenceNumber}`,
                    'Btn-User-Id': 'BTN0010042',
                    'Btn-Terminal-Id': 'PCDIMAS',
                    'Btn-Terminal-Ip': '10.99.17.134'
                  }
                });
                break; // Break loop if successful
              } catch (err: any) {
                if (attempt === maxRetries) throw err;
                console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
                await new Promise((res) => setTimeout(res, 2000 * attempt)); // Wait before retry
                attempt++;
              }
            }

            let responseBody;
            try {
              responseBody = await response!.json();
            } catch (e) {
              responseBody = await response!.text();
            }

            const responseContent = JSON.stringify({
              status: response!.status(),
              headers: response!.headers(),
              body: responseBody
            }, null, 2);

            await allure.attachment(
              `RESPONSE: ${step.TEST_CASE_NAME}`,
              responseContent,
              allure.ContentType.JSON
            );

            expect(response!.status()).toBe(step.EXPECTED_STATUS);

            if (!step.EXPECTED_SCHEMA) {
              continue;
            }

            const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
            const validationResult = InferredSchema.safeParse(responseBody);

            expect(validationResult.success, validationResult.error?.message).toBe(true);

            if (step.EXTRACT_KEY) {
              const body = responseBody;
              const rules = JSON.parse(step.EXTRACT_KEY);

              for (const [stateKey, responsePath] of Object.entries(rules)) {
                let sourceData = body;
                let path = responsePath as string;

                if (path.startsWith('req.') || path.startsWith('request.')) {
                  sourceData = requestData;
                  path = path.replace(/^(req|request)\./, '');
                } else if (path.startsWith('res.') || path.startsWith('response.')) {
                  path = path.replace(/^(res|response)\./, '');
                }

                const extractedValue = getNestedValue(sourceData, path);
                testState[stateKey] = extractedValue;
              }
            }
          }
        });
      });
    }
  }
});