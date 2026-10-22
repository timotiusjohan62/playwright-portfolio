// Cross-platform: clean old results, run tests, ALWAYS generate report,
// then exit with the test run's exit code.
const { spawnSync } = require('child_process');
const fs = require('fs');

fs.rmSync('allure-results', { recursive: true, force: true });

const args = process.argv.slice(2);
const tests = spawnSync('npx', ['playwright', 'test', ...args], { stdio: 'inherit', shell: true });

spawnSync('node', ['scripts/generate-report.js'], { stdio: 'inherit', shell: true });

process.exit(tests.status ?? 1);
