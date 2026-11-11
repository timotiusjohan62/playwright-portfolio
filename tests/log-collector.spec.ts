/**
 * Log Collector Web UI Testing
 *
 * End-to-end UI flow for the log collector web app:
 *   1. Open the web app in a browser
 *   2. Log in with credentials from environment variables
 *   3. Navigate to the log page
 *   4. Trigger the log download and verify the file
 *
 * All app-specific routes and selectors live in the APP constant below so they
 * are easy to adjust in one place, and all credentials come from .env files so
 * nothing sensitive is committed.
 *
 * Required environment variables (.env.<NODE_ENV>):
 *   LOG_COLLECTOR_BASE_URL  - e.g. https://log-collector.example.com
 *   LOG_COLLECTOR_USERNAME  - login user
 *   LOG_COLLECTOR_PASSWORD  - login password
 *
 * Run just this spec:
 *   npx playwright test log-collector
 */
import fs from 'fs';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { test, expect, allure } from '../fixtures/base';

// ==========================================
// 1. App Map (adjust routes / selectors to match the log collector web UI)
// ==========================================

/**
 * Placeholder routes and selectors - replace the TODO entries with the real
 * values for the log collector web app. Selectors can be CSS, text=..., or
 * any locator Playwright supports (e.g. page.locator syntax).
 */
const APP = {
  baseUrl: process.env.LOG_COLLECTOR_BASE_URL?.trim() ?? '',
  username: process.env.LOG_COLLECTOR_USERNAME ?? '',
  password: process.env.LOG_COLLECTOR_PASSWORD ?? '',

  routes: {
    login: '/login', // TODO: adjust - login page route
    logs: '/logs',   // TODO: adjust - log download page route
  },

  selectors: {
    // --- Login page ---
    usernameInput: '[name="username"]',             // TODO: adjust
    passwordInput: '[name="password"]',             // TODO: adjust
    submitButton: 'button[type="submit"]',          // TODO: adjust
    // Element that only appears once logged in (avatar, menu, logout link...)
    loggedInIndicator: '[data-testid="user-menu"]', // TODO: adjust
    // Element shown when credentials are wrong (used by the negative test)
    loginError: '[role="alert"]',                   // TODO: adjust

    // --- Log page ---
    // Any element whose id is "highlighter_{id}" - the first and last ones
    // get their content screenshotted
    highlighterItem: '[id^="highlighter_"]',
    downloadTrigger: 'button:has-text("Download")', // TODO: adjust
  },
};

/** Cap for the log preview attached to the Allure / HTML report. */
const MAX_LOG_PREVIEW_BYTES = 200_000;

// ==========================================
// 2. Helpers
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
 * Screenshots the content of a single "highlighter_{id}" element and attaches
 * it to the test report. Returns the element's actual id (e.g. highlighter_17).
 */
async function screenshotHighlighter(
  item: Locator,
  position: string,
  testInfo: TestInfo,
): Promise<string | null> {
  await expect(item).toBeVisible();

  const id = await item.getAttribute('id');
  const fileName = id ? `${id}_${position}.png` : `highlighter_${position}.png`;
  const savedPath = testInfo.outputPath(fileName);
  await item.screenshot({ path: savedPath });

  await testInfo.attach(`Highlighter ${position} (id: ${id ?? 'unknown'})`, {
    path: savedPath,
    contentType: 'image/png',
  });

  return id;
}

// ==========================================
// 3. Playwright Test Suite
// ==========================================

test.describe('Log Collector Web UI', { tag: '@log-collector' }, () => {

  // Skip cleanly (instead of failing) when the app under test is not configured
  test.skip(!APP.baseUrl, 'LOG_COLLECTOR_BASE_URL is not set - configure it in .env.<env>');
  test.skip(!APP.username || !APP.password,
    'LOG_COLLECTOR_USERNAME / LOG_COLLECTOR_PASSWORD are not set - configure them in .env.<env>');

  test('login and download log file', async ({ page }, testInfo) => {
    await allure.epic('Log Collector Web UI');
    await allure.feature('Log Download');
    await allure.story('Login, open log page and download the log');
    await allure.severity('critical');
    await allure.owner('QA Team');
    await allure.description(`Opens ${APP.baseUrl}, signs in with the configured user, opens the log page,
      downloads the log file and verifies it is saved and not empty.`);
    await allure.link(APP.baseUrl, 'App under test');

    // Log files can take a while to generate and download
    test.setTimeout(120_000);

    const loginPath = new URL(APP.routes.login, APP.baseUrl).pathname;

    await allure.step('Step 1: Login to the log collector web', async () => {
      await login(page, APP.username, APP.password);

      // The app should navigate away from the login page after a successful login
      await page.waitForURL((u) => u.pathname !== loginPath, { timeout: 20_000 });

      // Stronger check: an element that only appears once logged in
      await expect(page.locator(APP.selectors.loggedInIndicator)).toBeVisible();

      await testInfo.attach('Screenshot: logged in', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });

    await allure.step('Step 2: Open the log page', async () => {
      await page.goto(url(APP.routes.logs));
      await expect(page.locator(APP.selectors.downloadTrigger)).toBeVisible();

      await testInfo.attach('Screenshot: log page', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });

    await allure.step('Step 3: Screenshot first and last highlighter items', async (ctx) => {
      // All elements whose id matches "highlighter_{id}"
      const highlighterItems = page.locator(APP.selectors.highlighterItem);
      const count = await highlighterItems.count();
      await ctx.parameter('highlighter items found', String(count));

      // The log page should contain at least one highlighter element
      expect(count, 'Expected at least one element with id "highlighter_{id}"').toBeGreaterThan(0);

      // Screenshot what is inside the first highlighter element...
      const firstId = await screenshotHighlighter(highlighterItems.first(), 'first', testInfo);
      // ...and the last one (same element as the first when only one exists)
      const lastId = await screenshotHighlighter(highlighterItems.last(), 'last', testInfo);

      await ctx.parameter('first id', firstId ?? 'unknown');
      await ctx.parameter('last id', lastId ?? 'unknown');
    });

    await allure.step('Step 4: Download the log file', async (ctx) => {
      // Start listening before clicking so the download event is never missed
      const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
      await page.locator(APP.selectors.downloadTrigger).click();
      const download = await downloadPromise;

      // Save the file into the Playwright test output folder
      const fileName = download.suggestedFilename() || `downloaded-log-${Date.now()}.log`;
      const savedPath = testInfo.outputPath(fileName);
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

  test('login rejects invalid credentials', async ({ page }) => {
    await allure.epic('Log Collector Web UI');
    await allure.feature('Authentication');
    await allure.story('Login validation');
    await allure.severity('minor');
    await allure.owner('QA Team');
    await allure.description('Verifies the login form rejects a wrong password and surfaces an error message.');

    const loginPath = new URL(APP.routes.login, APP.baseUrl).pathname;

    await allure.step('Submit the login form with a wrong password', async () => {
      await login(page, APP.username, `${APP.password}-WRONG`);
    });

    await allure.step('Login fails with an error message', async () => {
      await expect(page.locator(APP.selectors.loginError)).toBeVisible();
      // ...and we are still on the login page
      expect(new URL(page.url()).pathname).toBe(loginPath);
    });
  });
});
