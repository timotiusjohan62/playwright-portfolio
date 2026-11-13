/**
 * Shared helpers for building LOG_SEARCH rows.
 *
 * Used by both the API suite (tests/example.spec.ts) and the Allure sync
 * script (scripts/sync-log-search.js) so both always produce the same rows.
 */
'use strict';

/** The dlog_code_filter input only accepts up to 90 characters. */
const MAX_FILTER_CODE_LENGTH = 90;

/** Walks an object and returns the first non-empty value for `key`. */
const findNestedValue = (value, key) => {
  const wanted = String(key).toLowerCase();
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    for (const [name, child] of Object.entries(current)) {
      if (name.toLowerCase() === wanted && child != null && child !== '') return String(child);
      if (child && typeof child === 'object') stack.push(child);
    }
  }
  return null;
};

/** Maps a step title / path onto the log collector's SEARCH_TEXT value. */
const classifySearchText = (title, urlPath) => {
  const text = String(title || '').toLowerCase();
  const path = String(urlPath || '').toLowerCase();

  if (text.includes('payment')) return 'http://Monetary/*';
  if (text.includes('inquiry') || text.includes('pgm_name') || text.includes('pgm')) {
    return 'http://NonMonetary/*';
  }
  // Program-name titles (e.g. WSMBS2617) are non-monetary SOAP services
  if (/\bws[a-z0-9]+\b/.test(text)) return 'http://NonMonetary/*';

  if (/\/payment(\/|$)/.test(path)) return 'http://Monetary/*';
  if (/\/monetary(\/|$)/.test(path)) return 'http://Monetary/*';
  if (/\/inquiry(\/|$)/.test(path)) return 'http://NonMonetary/*';
  return 'http://NonMonetary/*';
};

/** Monetary transactions carry the referenceNumber in the body; others in the header. */
const pickReferenceNumber = (searchText, headerReference, bodyReference) => {
  if (searchText === 'http://Monetary/*') return bodyReference || headerReference || null;
  return headerReference || bodyReference || null;
};

const isApiMonetaryPath = (urlPath) =>
  /(?:^|\/)api\/monetary(?:\/|$)/i.test(String(urlPath || ''));

/**
 * Builds FILTER_CODE: the request path without its leading slash, capped at 90
 * characters. Monetary API paths are filtered by their transactionCode instead.
 */
const cleanFilterCode = (urlPath, transactionCode) => {
  const useTransactionCode =
    isApiMonetaryPath(urlPath) &&
    transactionCode != null &&
    String(transactionCode).trim() !== '';

  const code = useTransactionCode
    ? String(transactionCode).trim()
    : String(urlPath || '').replace(/^\//, '').trim();

  return code.slice(0, MAX_FILTER_CODE_LENGTH);
};

const formatDate = (epochMs) => {
  const date = new Date(epochMs);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const dateFromTimestamp = (timestamp, fallbackEpochMs) => {
  const match = String(timestamp || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : formatDate(fallbackEpochMs);
};

/**
 * Builds a LOG_SEARCH record for one API step, or null when there is nothing
 * worth searching for (no reference or no filter code).
 */
const buildLogSearchRecord = ({
  testCaseName,
  title,
  urlPath,
  headerReference,
  bodyReference,
  requestBody,
  timestamp,
  startEpochMs,
}) => {
  const searchText = classifySearchText(title, urlPath);
  const referenceNumber = pickReferenceNumber(searchText, headerReference, bodyReference);
  if (!referenceNumber) return null;

  const transactionCode = findNestedValue(requestBody, 'transactionCode');
  const filterCode = cleanFilterCode(urlPath, transactionCode);
  if (!filterCode) return null;

  const date = dateFromTimestamp(timestamp, startEpochMs ?? Date.now());

  return {
    SCENARIO_NAME: `${testCaseName}-${title}`,
    SEARCH_TEXT: searchText,
    START_TIME: `${date} 00:00`,
    END_TIME: `${date} 23:59`,
    FILTER_LABEL: 'referenceNumber',
    FILTER_VALUE: referenceNumber,
    FILTER_CODE: filterCode,
    IS_EXECUTED: '1',
    EXPECT_RESULTS: '1',
  };
};

module.exports = {
  MAX_FILTER_CODE_LENGTH,
  findNestedValue,
  classifySearchText,
  pickReferenceNumber,
  isApiMonetaryPath,
  cleanFilterCode,
  formatDate,
  dateFromTimestamp,
  buildLogSearchRecord,
};
