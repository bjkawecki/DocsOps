#!/usr/bin/env node
/**
 * Ensures every key in de/emails.json also exists in en/emails.json (DE ⊆ EN).
 * Exit 1 on missing keys.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesRoot = join(__dirname, '../src/infrastructure/mail/locales');

/**
 * @param {unknown} value
 * @param {string} prefix
 * @returns {string[]}
 */
function flattenKeys(value, prefix = '') {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  /** @type {string[]} */
  const keys = [];
  for (const [k, v] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

const deJson = JSON.parse(readFileSync(join(localesRoot, 'de/emails.json'), 'utf8'));
const enJson = JSON.parse(readFileSync(join(localesRoot, 'en/emails.json'), 'utf8'));
const enKeys = new Set(flattenKeys(enJson));
/** @type {string[]} */
const missing = [];
for (const key of flattenKeys(deJson)) {
  if (!enKeys.has(key)) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(
    'Mail i18n key check failed: DE keys must exist in EN:\n' +
      missing.map((m) => `  - ${m}`).join('\n')
  );
  process.exit(1);
}

console.log(`Mail i18n key check OK (emails.json, DE ⊆ EN).`);
