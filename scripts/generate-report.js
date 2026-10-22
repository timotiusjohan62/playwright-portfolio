const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RESULTS = 'allure-results';
const REPORT = 'allure-report';
fs.mkdirSync(RESULTS, { recursive: true });

// 0. Scrub secrets from every result file (headers in Playwright error logs, etc.)
execSync('node scripts/scrub-results.js', { stdio: 'inherit' });

// 1. Carry history over from the previous report (trends, flaky tracking)
const oldHistory = path.join(REPORT, 'history');
const newHistory = path.join(RESULTS, 'history');
if (fs.existsSync(oldHistory)) {
  fs.rmSync(newHistory, { recursive: true, force: true });
  fs.cpSync(oldHistory, newHistory, { recursive: true });
  console.log('Restored Allure history.');
}

// 2. Failure categories
if (fs.existsSync('allure/categories.json')) {
  fs.copyFileSync('allure/categories.json', path.join(RESULTS, 'categories.json'));
}

// 3. Executor info
const e = process.env;
const executor = e.GITHUB_ACTIONS
  ? {
      name: 'GitHub Actions', type: 'github',
      buildName: `Run #${e.GITHUB_RUN_NUMBER}`, buildOrder: Number(e.GITHUB_RUN_NUMBER),
      buildUrl: `${e.GITHUB_SERVER_URL}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}`,
      reportName: 'Playwright API Report',
    }
  : { name: 'Local run', type: 'local', buildName: new Date().toISOString(), reportName: 'Playwright API Report' };
fs.writeFileSync(path.join(RESULTS, 'executor.json'), JSON.stringify(executor, null, 2));

// 4. Generate
execSync(`npx allure generate ${RESULTS} --clean -o ${REPORT}`, { stdio: 'inherit' });
console.log(`\nReport ready: ${REPORT}/index.html  (run "npm run report:open")`);
