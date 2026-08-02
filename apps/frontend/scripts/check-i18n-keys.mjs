#!/usr/bin/env node
/**
 * Ensures every key in de/*.json also exists in the matching en/*.json (DE ⊆ EN).
 * Exit 1 on missing keys.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesRoot = join(__dirname, '../src/i18n/locales');

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

const deDir = join(localesRoot, 'de');
const enDir = join(localesRoot, 'en');
const deFiles = readdirSync(deDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

/** @type {string[]} */
const missing = [];

for (const file of deFiles) {
  const dePath = join(deDir, file);
  const enPath = join(enDir, file);
  let enRaw;
  try {
    enRaw = readFileSync(enPath, 'utf8');
  } catch {
    missing.push(`${file}: EN namespace file missing`);
    continue;
  }
  const deJson = JSON.parse(readFileSync(dePath, 'utf8'));
  const enJson = JSON.parse(enRaw);
  const enKeys = new Set(flattenKeys(enJson));
  for (const key of flattenKeys(deJson)) {
    if (!enKeys.has(key)) {
      missing.push(`${file}: ${key}`);
    }
  }
}

if (missing.length > 0) {
  console.error(
    'i18n key check failed: DE keys must exist in EN:\n' + missing.map((m) => `  - ${m}`).join('\n')
  );
  process.exit(1);
}

console.log(`i18n key check OK (${deFiles.length} namespace(s), DE ⊆ EN).`);
