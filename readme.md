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

### UI Tests: Log Collector (`tests/log-collector.spec.ts`)

A browser-driven flow that opens the log collector web app, logs in, opens the
log page (`/dlog.do`), fills the log search form, runs the search, and verifies
the outcome via the first `see detail` link in the results table. When results
are expected, it clicks that link to open the first result's detail page
(same tab or a new tab, handled automatically), screenshots the content of the
first and last `highlighter_{id}` elements there, and downloads the log file
from the detail page, verifying it is saved and non-empty. A second test
checks that invalid credentials are rejected.

Configure these variables in `.env.<env>` (the suite skips itself with a clear
message while they are empty):

```dotenv
LOG_COLLECTOR_BASE_URL=https://log-collector.example.com
LOG_COLLECTOR_USERNAME=your-user
LOG_COLLECTOR_PASSWORD=your-password
```

#### Database-Driven Search Scenarios (`LOG_SEARCH` table)

Search scenarios mirror the API suite's no-code philosophy: every row in the
`LOG_SEARCH` table (`db/TESTDATA.db`) with `IS_EXECUTED = '1'` becomes its own
Playwright test. Only fields with a value in the row are filled, so a scenario
can leave anything it does not need empty.

| Column | Form field | Selector |
| :--- | :--- | :--- |
| `SCENARIO_NAME` | Test title / Allure story | - |
| `SEARCH_TEXT` | Search box **and** the matching `dlog_type_filter` option | `#searchInput`, `[name="dlog_type_filter"]` |
| `START_TIME` | Start timestamp (`dd/MM/yyyy HH:mm`) | `[name="dlog_timestamp_start_filter"]` |
| `END_TIME` | End timestamp (`dd/MM/yyyy HH:mm`) | `[name="dlog_timestamp_end_filter"]` |
| `FILTER_LABEL` | Filter dropdown (option value **or** visible text, e.g. `v_12` / `referenceNumber`) | `[name="dlogMd_label_filter"]` |
| `FILTER_VALUE` | Custom filter value | `[name="dlog_value_filter"]` |
| `FILTER_CODE` | Custom filter code | `[name="dlog_code_filter"]` |
| `EXPECT_RESULTS` | `1` (default) = results must be found; `0` = no results expected | - |

The timestamp inputs are readonly date-picker fields, so the spec fills them
by writing the value directly and dispatching `input`/`change` events
(`fillField()` helper) — normal typing is blocked by the picker.

The `#searchInput` field is a type-ahead and the `dlog_type_filter` `<select>`
depends on it: the spec types `SEARCH_TEXT` into the search box character by
character, then selects the option in `dlog_type_filter` whose value matches
`SEARCH_TEXT` (e.g. `<option value="http://NonMonetary/*">`). That interaction
is what makes the `dlogMd_label_filter` dropdown list its options — the spec
then waits for the `FILTER_LABEL` option before selecting it. Scenarios that set
`FILTER_LABEL` must therefore also set `SEARCH_TEXT`; the spec fails such rows
with a clear message instead of searching with a half-filled form.

Both `dlog_type_filter` and `dlogMd_label_filter` are handled by the same
`selectOptionByValueOrText()` helper: it waits for an option matching the DB
value **or** its visible text, selects the option's real value (firing
`input`/`change`), and — on timeout — attaches the dropdown's actual options
and form HTML to the report. The `dlog_type_filter` select is rendered
`display:none` (id `hiddenSelect`, a data store for a custom dropdown widget),
so it is never clicked — `selectOption(..., { force: true })` is used, which
works on hidden selects and triggers the same events as a real user selection.
Visible selects are clicked first in case the app populates them lazily.

A search "found results" when the first `see detail` image
(`#tdId > a > img[alt="see detail"]`) is present in the results table; when
nothing is found that image is absent. Scenarios with `EXPECT_RESULTS = '0'`
assert exactly that and skip the highlighter screenshots and the download.

```sql
-- Example: add an enabled scenario
INSERT INTO LOG_SEARCH
  (SCENARIO_NAME, SEARCH_TEXT, START_TIME, END_TIME, FILTER_LABEL, FILTER_VALUE, FILTER_CODE, EXPECT_RESULTS, IS_EXECUTED)
VALUES
  ('Errors from today', 'ERROR', '11/11/2026 00:00', '11/11/2026 23:59', NULL, NULL, NULL, '1', '1');
```

All routes and selectors live in the `APP` constant at the top of the spec, so
adjusting them to the real app takes one place. Run it in isolation with:

```bash
npx playwright test log-collector
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
│   ├── example.spec.ts       # The main database-driven test runner
│   └── log-collector.spec.ts # Web UI flow: login + log download
├── utils/
│   └── schemaInferrer.ts     # Utility to convert JSON to runtime schema validators
├── db/
│   ├── DEV_DATA.db           # SQLite database for dev tests
│   ├── STAGING_DATA.db       # SQLite database for staging tests
│   └── PROD_DATA.db          # SQLite database for production tests
├── package.json
└── playwright.config.ts      # Playwright configuration
```