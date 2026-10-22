// Defense in depth: scrub secrets from everything in allure-results/ before the report is built.
// Covers Playwright's own error text (call logs with raw request headers) that no fixture can intercept.
const fs = require('fs');
const path = require('path');

const DIR = 'allure-results';
const MASK = '***';
const SENSITIVE_HEADERS = new Set([
  'authorization', 'proxy-authorization', 'cookie', 'set-cookie',
  'x-api-key', 'x-auth-token', 'x-csrf-token',
]);
// Optional: exact secret values to blank out everywhere (comma-separated env var)
const LITERALS = (process.env.ALLURE_MASK_VALUES || '').split(',').map((s) => s.trim()).filter((s) => s.length >= 4);

const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

function scrubString(s) {
  let out = stripAnsi(s).replace(/^(\s*-?\s*)([A-Za-z0-9-]+):[ \t]*.*$/gm, (line, pre, name) =>
    SENSITIVE_HEADERS.has(name.toLowerCase()) ? `${pre}${name}: ${MASK}` : line,
  );
  for (const v of LITERALS) out = out.split(v).join(MASK);
  return out;
}

function scrubValue(v) {
  if (typeof v === 'string') return scrubString(v);
  if (Array.isArray(v)) return v.map(scrubValue);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrubValue(x)]));
  return v;
}

if (!fs.existsSync(DIR)) process.exit(0);
let files = 0;
for (const f of fs.readdirSync(DIR)) {
  const p = path.join(DIR, f);
  if (f.endsWith('-result.json') || f.endsWith('-container.json')) {
    fs.writeFileSync(p, JSON.stringify(scrubValue(JSON.parse(fs.readFileSync(p, 'utf8')))));
    files++;
  } else if (/-attachment\.(txt|md|json|log|html|xml|csv)$/.test(f)) {
    fs.writeFileSync(p, scrubString(fs.readFileSync(p, 'utf8')));
    files++;
  }
}
console.log(`Scrubbed ${files} Allure result files.`);
