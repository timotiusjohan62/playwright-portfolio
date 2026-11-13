/**
 * Log Collector Web UI Testing
 *
 * End-to-end UI flow for the log collector web app:
 *   1. Open the web app in a browser
 *   2. Log in with credentials from environment variables
 *   3. Navigate to the log page (/dlog.do)
 *   4. Fill the log search form with values from the LOG_SEARCH table
 *   5. Run the search (the first "see detail" image marks a found result)
 *   6. Open the first result's detail page and screenshot the first
 *      highlighter_{id} item as the request and the last as the response,
 *      under screenshot/<SCENARIO_NAME>/
 *   7. Download the log file and verify it is saved and not empty
 *
 * Search scenarios are database-driven: every row in LOG_SEARCH (db/TESTDATA.db)
 * with IS_EXECUTED = '1' becomes its own Playwright test - the same no-code
 * philosophy as the API suite in example.spec.ts. Credentials come from .env
 * files so nothing sensitive is committed.
 *
 * Required environment variables (.env.<NODE_ENV>):
 *   LOG_COLLECTOR_BASE_URL  - e.g. https://log-collector.example.com
 *   LOG_COLLECTOR_USERNAME  - login user
 *   LOG_COLLECTOR_PASSWORD  - login password
 *
 * Run just this spec:
 *   npx playwright test log-collector
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { test, expect, allure } from '../fixtures/base';

// ==========================================
// 1. App Map (adjust routes / selectors to match the log collector web UI)
// ==========================================

const APP = {
  baseUrl: process.env.LOG_COLLECTOR_BASE_URL?.trim() ?? '',
  username: process.env.LOG_COLLECTOR_USERNAME ?? '',
  password: process.env.LOG_COLLECTOR_PASSWORD ?? '',

  routes: {
    login: '/mwui2',       // login form lives on the root page
    logs: '/mwui2/dlog.do', // log download page
  },

  selectors: {
    // --- Login page (login form on the root page) ---
    usernameInput: '[name="j_username"]',
    passwordInput: '[name="j_password"]',
    // <button type="button" name="Submit"> (selector also matches
    // <input type="button" name="Submit"> just in case)
    submitButton: '[name="Submit"]',
    // Element that only appears once logged in: the "Welcome, <user>" banner
    // in the header form. Original inspected path:
    //   body > table > tbody > tr:nth-child(1) > td > table > tbody >
    //   tr:nth-child(1) > td > div > form > span   e.g. "Welcome, wpsadmin"
    loggedInIndicator: 'form > span:has-text("Welcome,")',
    // Element shown when credentials are wrong (used by the negative test).
    // Original inspected path:
    //   body > table > tbody > tr:nth-child(2) > td > form > table > tbody >
    //   tr:nth-child(5) > td:nth-child(3) > b > font
    //   e.g. "Invalid user name or password."
    loginError: 'form b:has-text("Invalid user name or password")',

    // --- Log search form on the log page (values from the LOG_SEARCH table) ---
    search: {
      // Free-text search box: <input type="text" id="searchInput">
      input: '#searchInput',
      // <select name="dlog_type_filter" id="hiddenSelect" style="display:none">
      // A hidden data store for the visible "Select Type" widget (#searchInput
      // + #optionsList). Its option values match the search text (e.g.
      // <option value="http://NonMonetary/*">), so SEARCH_TEXT is what gets
      // selected. The hidden select must NOT be selected directly: only the
      // visible widget's option click runs doLoadC1(), which populates the
      // dlogMd_label_filter dropdown.
      typeFilter: '[name="dlog_type_filter"]',
      // The visible custom "Select Type" widget: a text input that opens the
      // option list on focus/input, plus the list itself
      typeFilterInput: '#searchInput',
      typeFilterOptions: '#optionsList',
      // Readonly date-picker inputs (id="start-dt" / "end-dt", values in
      // "dd/MM/yyyy HH:mm" format) - filled via fillField() which writes the
      // value directly because the picker blocks typing
      startTime: '[name="dlog_timestamp_start_filter"]',
      endTime: '[name="dlog_timestamp_end_filter"]',
      // Dropdown that only lists its options after the search input + type
      // filter were used - matched by option value OR visible text
      filterLabel: '[name="dlogMd_label_filter"]',
      filterValue: '[name="dlog_value_filter"]',
      filterCode: '[name="dlog_code_filter"]',
      // Confirmed: <input type="button" value="Search">
      searchButton: 'input[value="Search"]',
    },

    // --- Search results ---
    // First "see detail" image in the results table - only exists when the
    // search found something: <td id="tdId"><a><img alt="see detail"></a></td>.
    // Legacy pages may repeat the tdId on every row, hence the .first() usage.
    resultDetail: '#tdId > a > img[alt="see detail"]',
    // The anchor wrapping the "see detail" image - this is what gets clicked
    // to open the result's detail page
    resultDetailLink: '#tdId > a:has(img[alt="see detail"])',

    // --- Log page ---
    // The highlighted log lines. Each one is followed by a hidden clipboard
    // <embed> whose id is "highlighter_{id}_clipboard", so those are excluded.
    highlighterItem: '[id^="highlighter_"]:not([id$="_clipboard"])',
    // Confirmed: <input type="button" value="Download File Log">
    downloadTrigger: 'input[value="Download File Log"]',
  },
};

/** Cap for the log preview attached to the Allure / HTML report. */
const MAX_LOG_PREVIEW_BYTES = 200_000;

/** Root folder for the per-scenario highlighter screenshots. */
const SCREENSHOT_ROOT = path.resolve('screenshot');

/** Builds the screenshot folder for a scenario: screenshot/<SCENARIO_NAME>. */
function scenarioScreenshotDir(scenarioName: string): string {
  const folderName = scenarioName.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'scenario';
  return path.join(SCREENSHOT_ROOT, folderName);
}

// ==========================================
// 2. Search Scenarios (database-driven)
// ==========================================

/** One row of the LOG_SEARCH table = one log search scenario. */
interface LogSearchRow {
  ID: number;
  /** Test title suffix and Allure story. */
  SCENARIO_NAME: string;
  /**
   * Value for #searchInput, and the matching option value in the
   * [name="dlog_type_filter"] dropdown (e.g. "http://NonMonetary/*").
   */
  SEARCH_TEXT: string | null;
  /** Value for [name="dlog_timestamp_start_filter"] - format "dd/MM/yyyy HH:mm". */
  START_TIME: string | null;
  /** Value for [name="dlog_timestamp_end_filter"] - format "dd/MM/yyyy HH:mm". */
  END_TIME: string | null;
  /** Option value for the [name="dlogMd_label_filter"] dropdown. */
  FILTER_LABEL: string | null;
  /** Value for [name="dlog_value_filter"]. */
  FILTER_VALUE: string | null;
  /** Value for [name="dlog_code_filter"]. */
  FILTER_CODE: string | null;
  /** '1' (default) = the search must find results; '0' = no results expected. */
  EXPECT_RESULTS: string | null;
  IS_EXECUTED: string;
}

/**
 * Loads every enabled scenario from the LOG_SEARCH table. A missing table or
 * database yields no scenarios and the suite skips itself with a clear
 * message instead of crashing.
 */
const loadScenarios = (): LogSearchRow[] => {
  try {
    const db = new Database('db/TESTDATA.db', { readonly: true });
    return db
      .prepare(`SELECT * FROM LOG_SEARCH WHERE IS_EXECUTED = '1' ORDER BY ID ASC`)
      .all() as LogSearchRow[];
  } catch {
    return [];
  }
};

const scenarios = loadScenarios();

// ==========================================
// 3. Helpers
// ==========================================

/** Resolves an app route into a fully qualified URL. */
const url = (route: string) => new URL(route, APP.baseUrl).toString();

/** Fills the login form and submits it. */
async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(url(APP.routes.login));
  await page.locator(APP.selectors.usernameInput).fill(username);
  await page.locator(APP.selectors.passwordInput).fill(password);
  await page.locator(APP.selectors.submitButton).click();
}

/**
 * Fills a form input, working around readonly fields. Date-picker widgets
 * typically render readonly text inputs (e.g. id="start-dt", placeholder
 * "dd/MM/yyyy HH:mm") that reject normal typing - Playwright's fill() fails
 * on them. For those the value is written directly and input/change events
 * are dispatched so the page's own scripts and the form submission pick it
 * up. The closing assertion verifies the field really holds the value.
 */
async function fillField(locator: Locator, value: string): Promise<void> {
  const isReadonly = await locator.evaluate((el) => (el as HTMLInputElement).readOnly);

  if (isReadonly) {
    await locator.evaluate((el, val) => {
      (el as HTMLInputElement).value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  } else {
    await locator.fill(value);
  }

  await expect(locator).toHaveValue(value);
}

/**
 * Selects an option of a native <select> by its value attribute OR its visible
 * text (case-insensitive) - legacy apps often use technical values (e.g.
 * <option value="v_12">referenceNumber</option>) where the DB stores the label.
 *
 * Some dropdowns only populate their option list after another field was
 * filled/clicked or after the dropdown itself was opened (visible selects are
 * clicked first; hidden ones cannot be clicked at all), so the list is polled
 * until the wanted option exists. On timeout the dropdown's real state (tag
 * name, every option's value/text, the surrounding form HTML) is attached to
 * the report so the report itself explains why the option never appeared.
 *
 * Returns the option's real value.
 */
async function selectOptionByValueOrText(
  page: Page,
  testInfo: TestInfo,
  selector: string,
  wanted: string,
  description: string,
): Promise<string> {
  const select = page.locator(selector);
  const isVisible = await select.isVisible().catch(() => false);

  // A display:none <select> (e.g. <select name="dlog_type_filter"
  // id="hiddenSelect" style="display:none">) is only a data store for a custom
  // dropdown widget - it can never be clicked, so the click is skipped for it.
  // Some visible selects only populate their list when opened, hence the click.
  if (isVisible) {
    await select.click({ timeout: 5_000 }).catch(() => { /* already populated */ });
  }

  try {
    await page.waitForFunction(
      ({ sel, value }) => {
        const el = document.querySelector(sel) as HTMLSelectElement | null;
        if (!el || el.tagName !== 'SELECT') return false;
        const wanted = value.trim().toLowerCase();
        return Array.from(el.options).some(
          (o) => o.value === value || o.text.trim().toLowerCase() === wanted,
        );
      },
      { sel: selector, value: wanted },
      { timeout: 10_000 },
    );
  } catch {
    const state = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null;
      if (!el) return { found: false, tagName: null, options: null, formHtml: null };
      const form = el.closest('form');
      return {
        found: true,
        tagName: el.tagName,
        options: el.tagName === 'SELECT'
          ? Array.from(el.options).map((o) => ({ value: o.value, text: o.text.trim() }))
          : null,
        formHtml: form ? form.innerHTML.replace(/\s+/g, ' ').slice(0, 20_000) : null,
      };
    }, selector);

    await testInfo.attach(`${description} state at timeout`, {
      body: JSON.stringify(state, null, 2),
      contentType: 'application/json',
    });

    const options = state.options ?? [];
    throw new Error(
      `The ${description} dropdown (${selector}) never listed "${wanted}" (waited 10s). ` +
      (state.found
        ? state.tagName === 'SELECT'
          ? `It currently holds ${options.length} option(s): ${JSON.stringify(options.slice(0, 20))}. ` +
            'If the expected entry is there under a different value/text, adjust the LOG_SEARCH row to that exact value. '
          : `The element is a <${String(state.tagName)}>, not a <select> - it is a custom dropdown that needs its own handling. `
        : 'The dropdown element was not found on the page at all. ') +
      `Full form HTML is attached as "${description} state at timeout".`
    );
  }

  // Pick the matching option and fire the change events the app listens for.
  // Both type arguments are given explicitly so TS does not fall back to the
  // void-argument overload.
  const matchedValue = await page.evaluate<string | null, { sel: string; value: string }>(
    ({ sel, value }) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null;
      if (!el) return null;
      const wanted = value.trim().toLowerCase();
      const match = Array.from(el.options).find(
        (o) => o.value === value || o.text.trim().toLowerCase() === wanted,
      );
      return match ? match.value : null;
    },
    { sel: selector, value: wanted },
  );

  const selectedValue = matchedValue ?? wanted;

  // selectOption() fires the same input/change events as a real selection.
  // force: true bypasses actionability checks for display:none selects, which
  // can never become visible - the option itself is still selected normally.
  try {
    await select.selectOption(selectedValue, { force: !isVisible });
  } catch {
    // Fallback: write the value directly and dispatch the events by hand
    await page.evaluate(({ sel, value }) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null;
      if (!el) return;
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { sel: selector, value: selectedValue });
  }

  await expect(select).toHaveValue(selectedValue);
  return selectedValue;
}

/**
 * Selects the log type through the UI the app actually exposes.
 *
 * When [name="dlog_type_filter"] is a normal visible <select> it is handled by
 * selectOptionByValueOrText(). In this app it is instead display:none
 * (id="hiddenSelect"), a data store behind a custom "Select Type" widget: a
 * text input (#searchInput) that opens a popup list (#optionsList). Selecting
 * the hidden select directly changes the stored value but runs no JavaScript,
 * so the dlogMd_label_filter dropdown stays empty (it only loads via
 * doLoadC1(), which is called by the visible widget's option click). Clicking
 * the matching widget option therefore is what "uses" this filter.
 *
 * Returns the hidden select's real option value.
 */
async function selectTypeFilter(
  page: Page,
  testInfo: TestInfo,
  wanted: string,
): Promise<string> {
  const selector = APP.selectors.search.typeFilter;
  const select = page.locator(selector);

  // A normal visible select needs no custom widget handling
  if (await select.isVisible().catch(() => false)) {
    return selectOptionByValueOrText(page, testInfo, selector, wanted, 'log type filter');
  }

  // Resolve the option from the hidden select so we click the exact visible text
  const match = await page.evaluate(({ sel, value }) => {
    const el = document.querySelector(sel) as HTMLSelectElement | null;
    if (!el) return null;
    const wanted = value.trim().toLowerCase();
    const option = Array.from(el.options).find(
      (o) => o.value === value || o.text.trim().toLowerCase() === wanted,
    );
    return option ? { value: option.value, text: option.text.trim() } : null;
  }, { sel: selector, value: wanted });

  if (!match) {
    const state = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null;
      return el
        ? Array.from(el.options).map((o) => ({ value: o.value, text: o.text.trim() }))
        : null;
    }, selector);
    await testInfo.attach('log type filter options at timeout', {
      body: JSON.stringify(state, null, 2),
      contentType: 'application/json',
    });
    throw new Error(
      `The log type filter (${selector}) has no option matching "${wanted}". ` +
      `It currently holds: ${JSON.stringify((state ?? []).slice(0, 20))}`,
    );
  }

  // Click the real widget option: this sets the hidden select value AND calls
  // doLoadC1(), which loads the dlogMd_label_filter options
  const typeInput = page.locator(APP.selectors.search.typeFilterInput);
  const typeOptions = page.locator(APP.selectors.search.typeFilterOptions);

  await typeInput.click();
  // Filling fires the widget's "input" handler, which renders the matching list
  await typeInput.fill(match.text);
  const option = typeOptions.getByText(match.text, { exact: true });
  await expect(option).toBeVisible();
  await option.click();

  await expect(select).toHaveValue(match.value);
  return match.value;
}

/**
 * Reads the first MAX_LOG_PREVIEW_BYTES of a file without loading the whole
 * file into memory (log files can be large).
 */
async function readPreview(filePath: string): Promise<string> {
  const { size } = await fs.promises.stat(filePath);
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const length = Math.min(size, MAX_LOG_PREVIEW_BYTES);
    const buffer = Buffer.alloc(length);
    await fh.read(buffer, 0, length, 0);
    return buffer.toString('utf8');
  } finally {
    await fh.close();
  }
}

/**
 * Screenshots the content of a single "highlighter_{id}" element into the
 * scenario folder and attaches it to the test report. Returns the element's
 * actual id (e.g. highlighter_17).
 */
async function screenshotHighlighter(
  item: Locator,
  position: string,
  outputDir: string,
  testInfo: TestInfo,
): Promise<string | null> {
  await expect(item).toBeVisible();

  const id = await item.getAttribute('id');
  const fileName = `${position}.png`;
  const savedPath = path.join(outputDir, fileName);
  await item.screenshot({ path: savedPath });

  await testInfo.attach(`Highlighter ${position} (id: ${id ?? 'unknown'})`, {
    path: savedPath,
    contentType: 'image/png',
  });

  return id;
}

// ==========================================
// 4. Playwright Test Suite
// ==========================================

test.describe('Log Collector Web UI', { tag: '@log-collector' }, () => {

  // Skip cleanly (instead of failing) when the app under test is not configured
  test.skip(!APP.baseUrl, 'LOG_COLLECTOR_BASE_URL is not set - configure it in .env.<env>');
  test.skip(!APP.username || !APP.password,
    'LOG_COLLECTOR_USERNAME / LOG_COLLECTOR_PASSWORD are not set - configure them in .env.<env>');
  test.skip(scenarios.length === 0,
    'No enabled scenarios in the LOG_SEARCH table - add a row and set IS_EXECUTED = 1');

  // Placeholder so the reason shows up in the report when nothing is enabled
  // in LOG_SEARCH (the for-loop below generates no tests in that case)
  if (scenarios.length === 0) {
    test('Search logs and download (scenario from LOG_SEARCH)', async () => {
      test.skip(true, 'No enabled scenarios in the LOG_SEARCH table - add a row and set IS_EXECUTED = 1');
    });
  }

  // One test per enabled row in LOG_SEARCH (same pattern as the API suite)
  for (const scenario of scenarios) {

    test(`Search logs and download: ${scenario.SCENARIO_NAME}`, async ({ page }, testInfo) => {
      await allure.epic('Log Collector Web UI');
      await allure.feature('Log Search & Download');
      await allure.story(`Scenario: ${scenario.SCENARIO_NAME}`);
      await allure.severity('critical');
      await allure.owner('QA Team');
      await allure.description(`Opens ${APP.baseUrl}, signs in with the configured user, opens the log page,
      fills the search form with the criteria from the LOG_SEARCH table (scenario "${scenario.SCENARIO_NAME}"),
      screenshots the request and response highlighter items, then downloads the log file.`);
      await allure.link(APP.baseUrl, 'App under test');

      // Searching for logs and generating the download can be slow
      test.setTimeout(180_000);

      // One output folder per LOG_SEARCH row: screenshot/<SCENARIO_NAME>/
      const screenshotDir = scenarioScreenshotDir(scenario.SCENARIO_NAME);
      fs.mkdirSync(screenshotDir, { recursive: true });

      await allure.step('Step 1: Login to the log collector web', async () => {
        await login(page, APP.username, APP.password);

        // The header swaps the login form for the "Welcome, <user>" banner once
        // logged in. The URL may stay on "/" so rely on the banner, not the URL.
        const welcome = page.locator(APP.selectors.loggedInIndicator);
        await expect(welcome).toContainText('Welcome', { timeout: 20_000 });

        // The banner also shows which account is logged in
        await expect(welcome).toContainText(APP.username);

        await testInfo.attach('Screenshot: logged in', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });

      await allure.step('Step 2: Open the log page', async () => {
        await page.goto(url(APP.routes.logs));
        // The search form must be present before we can fill it
        await expect(page.locator(APP.selectors.search.input)).toBeVisible();

        await testInfo.attach('Screenshot: log page', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });

      await allure.step('Step 3: Fill the log search form', async (ctx) => {
        const search = APP.selectors.search;
        const filled: string[] = [];

        // The app only lists the filter dropdown's options after the search
        // input has been filled and the type dropdown used, so a label filter
        // without search text can never work
        if (scenario.FILTER_LABEL && !scenario.SEARCH_TEXT) {
          throw new Error(
            `Scenario "${scenario.SCENARIO_NAME}" sets FILTER_LABEL but leaves SEARCH_TEXT empty - ` +
            'the filter dropdown only lists its options after the search input is filled and the type dropdown used'
          );
        }

        // Search input first: type into it, then use the type dropdown - the
        // app only lists the dlogMd_label_filter options after both happened
        if (scenario.SEARCH_TEXT) {
          const searchInput = page.locator(search.input);
          await searchInput.click();
          // Typed character by character so the type-ahead JS reacts to each
          // keystroke (a one-shot fill() can be missed by the widget)
          await searchInput.pressSequentially(scenario.SEARCH_TEXT, { delay: 50 });
          await expect(searchInput).toHaveValue(scenario.SEARCH_TEXT);
          filled.push(`text="${scenario.SEARCH_TEXT}"`);
        }
        if (scenario.START_TIME) {
          await fillField(page.locator(search.startTime), scenario.START_TIME);
          filled.push(`from=${scenario.START_TIME}`);
        }
        if (scenario.END_TIME) {
          await fillField(page.locator(search.endTime), scenario.END_TIME);
          filled.push(`to=${scenario.END_TIME}`);
        }
        // The type dropdown: its option values match the search text
        // (e.g. <option value="http://NonMonetary/*">), so SEARCH_TEXT is the
        // value picked here. Clicking the visible widget option is what
        // populates the label dropdown.
        if (scenario.SEARCH_TEXT) {
          const typeValue = await selectTypeFilter(
            page,
            testInfo,
            scenario.SEARCH_TEXT,
          );
          filled.push(`type=${typeValue}`);
        }
        if (scenario.FILTER_LABEL) {
          await selectOptionByValueOrText(
            page,
            testInfo,
            search.filterLabel,
            scenario.FILTER_LABEL,
            'label filter',
          );
          filled.push(`label=${scenario.FILTER_LABEL}`);
        }
        if (scenario.FILTER_VALUE) {
          await fillField(page.locator(search.filterValue), scenario.FILTER_VALUE);
          filled.push(`value="${scenario.FILTER_VALUE}"`);
        }
        if (scenario.FILTER_CODE) {
          await fillField(page.locator(search.filterCode), scenario.FILTER_CODE);
          filled.push(`code="${scenario.FILTER_CODE}"`);
        }

        await ctx.parameter('criteria', filled.join(', ') || '(no filters)');

        // Evidence of the filled form (helpful when a dependent dropdown such
        // as dlogMd_label_filter still looks empty)
        await testInfo.attach('Screenshot: search form filled', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      });

      let resultsFound = false;
      // The page the result detail is shown on (same tab or a popup)
      let detailPage: Page = page;

      await allure.step('Step 4: Run the search', async (ctx) => {
        await page.locator(APP.selectors.search.searchButton).click();

        // The first "see detail" image in the results table marks the first
        // found result. When the search finds nothing it is simply absent.
        const firstDetail = page.locator(APP.selectors.resultDetail).first();
        const expectResults = (scenario.EXPECT_RESULTS ?? '1') === '1';
        await ctx.parameter('expect results', expectResults ? 'yes' : 'no');

        if (expectResults) {
          await expect(firstDetail).toBeVisible({ timeout: 30_000 });
          resultsFound = true;
          await ctx.parameter('results', 'found');
        } else {
          // No results expected: the "see detail" image must NOT appear
          await expect(firstDetail).toHaveCount(0, { timeout: 30_000 });
          await ctx.parameter('results', 'none (as expected)');

          await testInfo.attach('Screenshot: no results', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
          });
        }
      });

      if (!resultsFound) {
        // Nothing to screenshot or download without results
        await allure.step('Step 5: Nothing to screenshot or download', async (ctx) => {
          await ctx.parameter('reason', 'search returned no results - nothing to screenshot or download');
        });
        return;
      }

      await allure.step('Step 5: Open the first result detail', async (ctx) => {
        // Click the first "see detail" link (the anchor wrapping the image)
        const link = page.locator(APP.selectors.resultDetailLink).first();

        // The detail can open in a new tab (target="_blank") or the same one
        const target = await link.getAttribute('target');
        const newTab = !!target && !['_self', '_top', '_parent'].includes(target);
        await ctx.parameter('opens in', newTab ? 'new tab' : 'same tab');

        if (newTab) {
          const [detail] = await Promise.all([
            page.waitForEvent('popup'),
            link.click(),
          ]);
          detailPage = detail;
          await detailPage.waitForLoadState();
        } else {
          await link.click();
          await page.waitForLoadState();
        }

        await ctx.parameter('detail url', detailPage.url());
      });

      await allure.step('Step 6: Screenshot request and response highlighter items', async (ctx) => {
        // All elements whose id matches "highlighter_{id}" on the detail page
        const highlighterItems = detailPage.locator(APP.selectors.highlighterItem);

        // Give the detail page time to render its content
        await expect(highlighterItems.first()).toBeVisible({ timeout: 30_000 });

        const count = await highlighterItems.count();
        await ctx.parameter('highlighter items found', String(count));
        await ctx.parameter('screenshot folder', screenshotDir);

        // The first highlighter is the request payload...
        const requestId = await screenshotHighlighter(
          highlighterItems.first(),
          'request',
          screenshotDir,
          testInfo,
        );
        // ...and the last one is the response payload (the same element when
        // only one exists)
        const responseId = await screenshotHighlighter(
          highlighterItems.last(),
          'response',
          screenshotDir,
          testInfo,
        );

        await ctx.parameter('request id', requestId ?? 'unknown');
        await ctx.parameter('response id', responseId ?? 'unknown');
      });

      await allure.step('Step 7: Download the log file', async (ctx) => {
        // Start listening before clicking so the download event is never missed
        const downloadPromise = detailPage.waitForEvent('download', { timeout: 90_000 });
        await detailPage.locator(APP.selectors.downloadTrigger).click();
        const download = await downloadPromise;

        // Save the file into the same per-scenario folder as the screenshots
        const fileName = path.basename(download.suggestedFilename() || `downloaded-log-${Date.now()}.log`);
        const savedPath = path.join(screenshotDir, fileName);
        await download.saveAs(savedPath);

        const { size } = await fs.promises.stat(savedPath);
        await ctx.parameter('file', fileName);
        await ctx.parameter('size bytes', String(size));
        await ctx.parameter('saved to', savedPath);

        // Base assertion: the download must have produced a non-empty file
        expect(size, 'Downloaded log file should not be empty').toBeGreaterThan(0);

        // Attach a preview of the log to the Allure / HTML report
        await testInfo.attach(`Log preview: ${fileName}`, {
          body: await readPreview(savedPath),
          contentType: 'text/plain',
        });
      });
    });
  }

  test('login rejects invalid credentials', async ({ page }) => {
    await allure.epic('Log Collector Web UI');
    await allure.feature('Authentication');
    await allure.story('Login validation');
    await allure.severity('minor');
    await allure.owner('QA Team');
    await allure.description('Verifies the login form rejects a wrong password and surfaces an error message.');

    await allure.step('Submit the login form with a wrong password', async () => {
      await login(page, APP.username, `${APP.password}-WRONG`);
    });

    await allure.step('Login fails with an error message', async () => {
      // The login form shows an inline error (the URL may or may not change,
      // so rely on the error message itself)
      await expect(page.locator(APP.selectors.loginError))
        .toContainText('Invalid user name or password', { timeout: 20_000 });
    });
  });
});
