import { defineConfig, devices } from '@playwright/test';
import os from 'os';

const isCI = !!process.env.CI;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  // Retries are what let Allure flag flaky tests (failed then passed)
  retries: isCI ? 2 : 1,
  workers: isCI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // playwright.config.ts
  reporter: [
      ['list'],
      ['allure-playwright', {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        // Shown in the "Environment" widget of the report
        environmentInfo: {
          ENV: process.env.TEST_ENV ?? 'local',
          BASE_URL: process.env.BASE_URL ?? 'https://playwright.dev',
          OS: `${os.platform()} ${os.release()}`,
          NODE: process.version,
          CI: String(isCI),
          BRANCH: process.env.GITHUB_REF_NAME ?? 'local',
          COMMIT: (process.env.GITHUB_SHA ?? 'n/a').slice(0, 8),
        },
      }],
    ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.API_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],


  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
