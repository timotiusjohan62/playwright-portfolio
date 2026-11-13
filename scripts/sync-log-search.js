const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const {
  findNestedValue,
  classifySearchText,
  cleanFilterCode,
  buildLogSearchRecord,
} = require('../utils/logSearch');

const RESULTS_DIR = 'allure-results';
const DB_PATH = 'db/TESTDATA.db';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const replace = args.has('--replace');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const collectAttachments = (steps) => {
  const attachments = [];
  const walk = (items) => {
    for (const item of items || []) {
      if (item.attachments) attachments.push(...item.attachments);
      walk(item.steps);
    }
  };
  walk(steps);
  return attachments;
};

const readAttachment = (attachment) => {
  try {
    return fs.readFileSync(path.join(RESULTS_DIR, attachment.source), 'utf8');
  } catch {
    return '';
  }
};

const loadLatestApiResults = () => {
  const files = fs.readdirSync(RESULTS_DIR).filter((file) => file.endsWith('-result.json'));
  const latest = new Map();

  for (const file of files) {
    let result;
    try {
      result = readJson(path.join(RESULTS_DIR, file));
    } catch {
      continue;
    }
    if (!result.name?.startsWith('Executes scenario:')) continue;

    const key = result.historyId || result.fullName || result.name;
    const previous = latest.get(key);
    if (!previous || (result.start ?? 0) > (previous.start ?? 0)) latest.set(key, result);
  }

  return [...latest.values()];
};

const buildRows = () => {
  const rows = new Map();
  const stats = {
    scenarios: 0,
    steps: 0,
    monetary: 0,
    nonMonetary: 0,
    unclassified: 0,
    missingReference: 0,
    missingPath: 0,
  };

  for (const result of loadLatestApiResults()) {
    const testCaseName = result.name.replace(/^Executes scenario:\s*/, '');
    stats.scenarios++;

    for (const step of result.steps || []) {
      const stepMatch = step.name?.match(/^Step \d+:\s*(.+)$/);
      if (!stepMatch) continue;

      stats.steps++;
      const title = stepMatch[1].trim();
      const attachments = collectAttachments([step]);

      let request = null;
      let requestBody = null;
      let responseBody = null;

      for (const attachment of attachments) {
        const text = readAttachment(attachment);
        if (!text) continue;

        if (attachment.name === 'Request') {
          try { request = JSON.parse(text); } catch { /* ignore malformed attachment */ }
        } else if (attachment.name === 'Request body') {
          try { requestBody = JSON.parse(text); } catch { /* ignore malformed attachment */ }
        } else if (attachment.name === 'Response body') {
          try { responseBody = JSON.parse(text); } catch { /* ignore malformed attachment */ }
        }
      }

      const urlPath = request?.path || (() => {
        try { return new URL(request?.url).pathname; } catch { return null; }
      })();
      const filterCode = cleanFilterCode(urlPath, findNestedValue(requestBody, 'transactionCode'));
      if (!filterCode) {
        stats.missingPath++;
        continue;
      }

      const searchText = classifySearchText(title, urlPath);
      if (searchText === 'http://Monetary/*') stats.monetary++;
      else if (searchText === 'http://NonMonetary/*') stats.nonMonetary++;
      else stats.unclassified++;

      const headers = request?.headers || {};
      const headerReference =
        headers['Btn-Reference-Number'] ||
        headers['btn-reference-number'] ||
        headers['BTN-REFERENCE-NUMBER'] ||
        findNestedValue(headers, 'Btn-Reference-Number');

      const bodyReference =
        findNestedValue(requestBody, 'referenceNumber') ||
        findNestedValue(responseBody, 'referenceNumber');

      const record = buildLogSearchRecord({
        testCaseName,
        title,
        urlPath,
        headerReference,
        bodyReference,
        requestBody,
        timestamp: headers['x-timestamp'] || headers['X-Timestamp'],
        startEpochMs: result.start ?? Date.now(),
      });

      if (!record) {
        stats.missingReference++;
        continue;
      }

      rows.set(record.SCENARIO_NAME, record);
    }
  }

  return { rows: [...rows.values()], stats };
};

const main = () => {
  const { rows, stats } = buildRows();
  const executable = rows.filter((row) => row.IS_EXECUTED === '1');

  console.log('Allure API scan');
  console.log(`  scenarios:        ${stats.scenarios}`);
  console.log(`  steps:            ${stats.steps}`);
  console.log(`  monetary:         ${stats.monetary}`);
  console.log(`  non-monetary:     ${stats.nonMonetary}`);
  console.log(`  unclassified:     ${stats.unclassified}`);
  console.log(`  missing path:     ${stats.missingPath}`);
  console.log(`  missing ref:      ${stats.missingReference}`);
  console.log(`  LOG_SEARCH rows:  ${rows.length} (${executable.length} executable)`);

  if (dryRun) {
    console.log('\nFirst 20 rows:');
    for (const row of rows.slice(0, 20)) console.log(row);
    const unclassified = rows.filter((row) => !row.SEARCH_TEXT);
    if (unclassified.length) {
      console.log('\nUnclassified rows:');
      for (const row of unclassified) {
        console.log(`${row.SCENARIO_NAME} -> /${row.FILTER_CODE}`);
      }
    }
    return;
  }

  const db = new Database(DB_PATH);
  const insert = db.prepare(`
    INSERT INTO LOG_SEARCH
      (SCENARIO_NAME, SEARCH_TEXT, START_TIME, END_TIME, FILTER_LABEL, FILTER_VALUE, FILTER_CODE, IS_EXECUTED, EXPECT_RESULTS)
    VALUES
      (@SCENARIO_NAME, @SEARCH_TEXT, @START_TIME, @END_TIME, @FILTER_LABEL, @FILTER_VALUE, @FILTER_CODE, @IS_EXECUTED, @EXPECT_RESULTS)
  `);

  const write = db.transaction((records) => {
    if (replace) db.prepare('DELETE FROM LOG_SEARCH').run();
    for (const record of records) {
      if (replace) {
        insert.run(record);
      } else {
        const existing = db.prepare('SELECT ID FROM LOG_SEARCH WHERE SCENARIO_NAME = ?').get(record.SCENARIO_NAME);
        if (existing) {
          db.prepare(`
            UPDATE LOG_SEARCH
               SET SEARCH_TEXT = @SEARCH_TEXT, START_TIME = @START_TIME, END_TIME = @END_TIME,
                   FILTER_LABEL = @FILTER_LABEL, FILTER_VALUE = @FILTER_VALUE, FILTER_CODE = @FILTER_CODE,
                   IS_EXECUTED = @IS_EXECUTED, EXPECT_RESULTS = @EXPECT_RESULTS
             WHERE ID = @ID
          `).run({ ...record, ID: existing.ID });
        } else {
          insert.run(record);
        }
      }
    }
  });

  write(rows);
  console.log(`\nWrote ${rows.length} rows to ${DB_PATH}${replace ? ' (table replaced)' : ''}.`);
};

main();
