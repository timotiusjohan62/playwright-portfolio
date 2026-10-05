# Multi-Environment Database-Driven API Testing Framework

A dynamic, data-driven API testing framework built with [Playwright](https://playwright.dev/), [SQLite](https://github.com/WiseLibs/better-sqlite3), and Schema Validation (e.g., Zod).

This framework allows QA engineers and developers to define complete API workflows, payloads, and assertions entirely inside a SQLite database. It now fully supports multiple environments (Dev, Staging, Prod) and uses a flexible column-mapping configuration, meaning your database schema can change without requiring code rewrites.

## 🚀 Key Features

*   **Multi-Environment Support:** Easily switch between Development, Staging, and Production databases and base URLs using a simple environment variable.
*   **Flexible Column Mapping:** Database column names are decoupled from the test logic. If your DB schema changes, just update the config object.
*   **No-Code Test Authoring:** Define multi-step API tests inside your database without touching TypeScript.
*   **Dynamic Variable Passing:** Extract data from a response (like an Auth Token or a generated ID) and inject it into subsequent steps using `{{variable}}` templating.
*   **Automated Schema Validation:** Automatically enforce strict payload structure and type validation on API responses using dynamically inferred schemas.

## 📦 Prerequisites

Ensure you have the following installed:
*   Node.js (v16+)
*   NPM or Yarn

Install dependencies:
```bash
npm install @playwright/test better-sqlite3
npm install --save-dev @types/better-sqlite3
```
*(Note: A schema library like Zod is assumed to be handling `generateDynamicSchema` under the hood).*

## ⚙️ Environment Configuration

The framework uses the `TEST_ENV` environment variable to determine which database, table, and base URL to use. 

Supported environments out-of-the-box:
*   `dev` (Default)
*   `staging`
*   `prod`

### Running Tests

**macOS / Linux:**
```bash
# Run Dev (default)
npx playwright test

# Run Staging
TEST_ENV=staging npx playwright test

# Run Prod
TEST_ENV=prod npx playwright test
```

**Windows (PowerShell):**
```powershell
$env:TEST_ENV="staging"; npx playwright test
```

## 🗄️ Database Structure

The framework maps your database columns to standard testing concepts. By default, it expects tables like `DEV_WORKFLOWS`, `STAGING_WORKFLOWS`, etc.

### Default Column Mapping

| Column Target | Default DB Column | Description | Example |
| :--- | :--- | :--- | :--- |
| `testCaseName` | `TEST_CASE_NAME` | Groups steps into a single E2E test | `"User_Onboarding_Flow"` |
| `title` | `TITLE` | Description of the specific step | `"Create New User"` |
| `stepOrder` | `STEP_ORDER` | Execution order within the test case | `1` |
| `method` | `TYPE` | HTTP Method | `"POST"` |
| `endpoint` | `PATH` | Target URL/Endpoint (appended to Base URL) | `"/users/{{userId}}"` |
| `payload` | `PAYLOAD` | Request body (supports templates) | `{"name": "John", "role": "admin"}` |
| `expectedStatus`| `EXPECTED_STATUS` | Expected HTTP status code | `201` |
| `expectedSchema`| `EXPECTED_SCHEMA` | JSON representing the expected response schema | `{"type": "object", "properties": {"id": {"type": "number"}}}` |
| `extractKey` | `EXTRACT_KEY` | Rules mapping response JSON paths to state variables | `{"userId": "data.user.id"}` |

*(Note: If your database uses different column names, simply update the `dbColumns` object in the test file).*

## 🧠 How it Works

1. **Environment Setup:** Reads `TEST_ENV` to load the correct base URL, database path, and table name.
2. **Workflow Generation:** Queries the active table for all unique `TEST_CASE_NAME`s and dynamically generates a Playwright `test()` block for each.
3. **Step Execution:** Fetches steps for the workflow, sorted by `STEP_ORDER`.
4. **Variable Hydration:** Scans the endpoint path and payload for handlebars-style variables (e.g., `{{token}}`) and replaces them with values extracted from previous steps in the same workflow.
5. **Execution & Status Check:** Makes the HTTP call and asserts the status code.
6. **Schema Validation:** Parses the `EXPECTED_SCHEMA` JSON to dynamically generate a validation schema and asserts the response structure.
7. **State Extraction:** Reads the `EXTRACT_KEY` object. Uses dot-notation to pull values from the response payload and saves them into the local runtime memory for future steps.

## 📁 Project Structure

```
├── tests/
│   └── api-test.spec.ts      # The main database-driven test runner
├── utils/
│   └── schemaInferrer.ts     # Utility to convert JSON to runtime schema validators
├── db/
│   ├── DEV_DATA.db           # SQLite database for dev tests
│   ├── STAGING_DATA.db       # SQLite database for staging tests
│   └── PROD_DATA.db          # SQLite database for production tests
├── package.json
└── playwright.config.ts      # Playwright configuration
```