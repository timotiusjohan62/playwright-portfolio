// Posts a run summary to Slack. Needs SLACK_WEBHOOK_URL (Node 18+).
const fs = require('fs');

const webhook = process.env.SLACK_WEBHOOK_URL;
if (!webhook) { console.log('SLACK_WEBHOOK_URL not set, skipping.'); process.exit(0); }

const summary = JSON.parse(fs.readFileSync('allure-report/widgets/summary.json', 'utf8'));
const { passed = 0, failed = 0, broken = 0, skipped = 0, total = 0 } = summary.statistic;
const mins = (summary.time.duration / 60000).toFixed(1);
const ok = failed + broken === 0;
const reportUrl = process.env.REPORT_URL ?? '';

const text =
  `${ok ? ':white_check_mark:' : ':x:'} *Playwright run ${ok ? 'passed' : 'failed'}*\n` +
  `Total: ${total} | Passed: ${passed} | Failed: ${failed} | Broken: ${broken} | Skipped: ${skipped}\n` +
  `Duration: ${mins} min` + (reportUrl ? `\n<${reportUrl}|Open Allure report>` : '');

fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text }),
}).then((r) => console.log('Slack status:', r.status));
