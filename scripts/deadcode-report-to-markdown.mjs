#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

function arg(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function rel(p) {
  return String(p || '').replaceAll('\\', '/');
}

function isStrictEnabled(value) {
  const v = String(value ?? '0').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function inScope(file, scope) {
  if (!file) return false;
  const normalized = rel(file);
  const prefix = scope === 'backend' ? 'apps/backend/' : 'apps/frontend/';
  return normalized.startsWith(prefix);
}

function isStrictNoiseFile(file) {
  return (
    file.includes('/generated/') ||
    file.endsWith('/index.ts') ||
    file.endsWith('/api-types.ts') ||
    file.endsWith('/vite.config.ts') ||
    file.endsWith('/vitest.config.ts')
  );
}

function knipItemCount(item) {
  const keys = [
    'dependencies',
    'devDependencies',
    'optionalPeerDependencies',
    'unlisted',
    'unresolved',
    'exports',
    'types',
    'enumMembers',
    'namespaceMembers',
    'files',
    'binaries',
    'catalog',
    'duplicates',
  ];
  return keys.reduce((sum, key) => sum + (Array.isArray(item?.[key]) ? item[key].length : 0), 0);
}

function namesOf(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter((name) => typeof name === 'string' && name.length > 0);
}

function toIssueRows(knipJson, scope, strict) {
  const issues = Array.isArray(knipJson?.issues) ? knipJson.issues : [];
  const rows = [];
  for (const issue of issues) {
    const file = rel(issue?.file);
    if (!inScope(file, scope)) continue;
    if (strict && isStrictNoiseFile(file)) continue;
    const count = knipItemCount(issue);
    if (count === 0) continue;
    const issueSummary = {
      file,
      count,
      exports: (issue.exports ?? []).length,
      deps: (issue.dependencies ?? []).length + (issue.devDependencies ?? []).length,
      unresolved: (issue.unresolved ?? []).length,
      unlisted: (issue.unlisted ?? []).length,
      files: (issue.files ?? []).length,
      types: (issue.types ?? []).length,
      duplicates: (issue.duplicates ?? []).length,
      exportNames: namesOf(issue.exports),
      typeNames: namesOf(issue.types),
      depNames: [...namesOf(issue.dependencies), ...namesOf(issue.devDependencies)],
    };
    if (strict) {
      const actionable =
        issueSummary.exports +
        issueSummary.types +
        issueSummary.unresolved +
        issueSummary.unlisted +
        issueSummary.files +
        issueSummary.deps;
      if (actionable === 0) continue;
    }
    rows.push(issueSummary);
  }
  return rows.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));
}

const scope = arg('--scope', 'backend');
const knipPath = arg('--knip');
const outputPath = arg('--output');
const strict = isStrictEnabled(arg('--strict', '0'));

if (!knipPath || !outputPath) {
  console.error(
    'Usage: node scripts/deadcode-report-to-markdown.mjs --scope backend|frontend --knip <file> --output <file> [--strict 0|1]'
  );
  process.exit(1);
}

const knipContent = await fs.readFile(knipPath, 'utf8').catch(() => '{"issues":[]}');

let knipJson;
try {
  knipJson = JSON.parse(knipContent);
} catch {
  knipJson = { issues: [] };
}

const knipRows = toIssueRows(knipJson, scope, strict);

const now = new Date().toISOString();
let out = '';
out += `# Dead Code Report (${scope})\n\n`;
out += `- Erzeugt: ${now}\n`;
out += `- Modus: **${strict ? 'strict' : 'standard'}**\n`;
out += `- Werkzeug: **knip**\n`;
out += `- Dateien mit Issues: **${knipRows.length}**\n\n`;

out += '## Übersicht\n\n';
if (knipRows.length === 0) {
  out += 'Keine Treffer im gewählten Scope.\n';
} else {
  out +=
    '| Rang | Datei | Gesamt | Exports | Types | Deps | Unresolved | Unlisted | Files | Duplicates |\n';
  out += '|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|\n';
  knipRows.slice(0, 200).forEach((row, idx) => {
    out += `| ${idx + 1} | \`${row.file}\` | ${row.count} | ${row.exports} | ${row.types} | ${row.deps} | ${row.unresolved} | ${row.unlisted} | ${row.files} | ${row.duplicates} |\n`;
  });
  if (knipRows.length > 200) {
    out += `\n... und ${knipRows.length - 200} weitere Dateien mit Issues.\n`;
  }

  out += '\n## Details (Top 15)\n\n';
  out +=
    'Viele „unused exports/types“ sind oft nur unnötig `export`ed und weiterhin **in derselben Datei** genutzt (Zod-Schemas, interne Helfer). Prüfen: Export entfernen vs. wirklich löschen.\n\n';
  for (const row of knipRows.slice(0, 15)) {
    out += `### \`${row.file}\`\n\n`;
    if (row.exportNames.length > 0) {
      out += `- Exports: ${row.exportNames.map((n) => `\`${n}\``).join(', ')}\n`;
    }
    if (row.typeNames.length > 0) {
      out += `- Types: ${row.typeNames.map((n) => `\`${n}\``).join(', ')}\n`;
    }
    if (row.depNames.length > 0) {
      out += `- Deps: ${row.depNames.map((n) => `\`${n}\``).join(', ')}\n`;
    }
    if (row.exportNames.length === 0 && row.typeNames.length === 0 && row.depNames.length === 0) {
      out += `- (siehe Unresolved/Unlisted/Files/Duplicates in der Übersicht)\n`;
    }
    out += '\n';
  }
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, out, 'utf8');
console.log(`Dead code report written to ${outputPath}`);
