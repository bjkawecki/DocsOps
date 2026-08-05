import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedCsvData, SeedRow } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve seed CSV directory for both tsx (`src/seed`) and compiled (`dist/src/seed`) layouts.
 */
function resolveSeedDataDir(): string {
  const candidates = [
    resolve(__dirname, '../../../prisma/seed-data'), // dist/src/seed → package root
    resolve(__dirname, '../../prisma/seed-data'), // src/seed → package root
    resolve(process.cwd(), 'prisma/seed-data'),
  ];
  for (const dir of candidates) {
    if (existsSync(resolve(dir, 'companies.csv'))) {
      return dir;
    }
  }
  throw new Error(
    `Seed CSV directory not found (companies.csv missing). Tried:\n${candidates
      .map((c) => `  - ${c}`)
      .join('\n')}`
  );
}

function parseCsv(seedDataDir: string, path: string): string[][] {
  const fullPath = resolve(seedDataDir, path);
  if (!existsSync(fullPath)) return [];
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

function csvRows(seedDataDir: string, path: string): SeedRow[] {
  const rows = parseCsv(seedDataDir, path);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: SeedRow = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? '';
    });
    return obj;
  });
}

function loadSeedCsvData(): SeedCsvData {
  const seedDataDir = resolveSeedDataDir();
  return {
    companies: csvRows(seedDataDir, 'companies.csv'),
    departments: csvRows(seedDataDir, 'departments.csv'),
    teams: csvRows(seedDataDir, 'teams.csv'),
    users: csvRows(seedDataDir, 'users.csv'),
    teamMembers: csvRows(seedDataDir, 'team_members.csv'),
    teamLeaders: csvRows(seedDataDir, 'team_leaders.csv'),
    teamAuthors: csvRows(seedDataDir, 'team_authors.csv'),
    departmentLeads: csvRows(seedDataDir, 'department_leads.csv'),
    companyLeads: csvRows(seedDataDir, 'company_leads.csv'),
  };
}

export { loadSeedCsvData, resolveSeedDataDir };
