import manifestJson from '../../../../content/releases/manifest.json';

const OPERATORS_SECTION_HEADING = '## For operators';

const releaseMarkdownModules = import.meta.glob('../../../../content/releases/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

type ManifestRelease = {
  version: string;
  date: string;
  title: string;
};

export type LandingRelease = ManifestRelease & {
  markdown: string;
};

function parseSemVer(version: string): [number, number, number] {
  const [major, minor, patch] = version.split('.').map((part) => Number.parseInt(part, 10));
  return [major ?? 0, minor ?? 0, patch ?? 0];
}

function compareSemVerDesc(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseSemVer(a);
  const [bMajor, bMinor, bPatch] = parseSemVer(b);
  if (aMajor !== bMajor) return bMajor - aMajor;
  if (aMinor !== bMinor) return bMinor - aMinor;
  return bPatch - aPatch;
}

/** Same rule as the app: hide `## For operators` from end-user release notes. */
function userFacingMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const operatorIndex = lines.findIndex((line) => line.trim() === OPERATORS_SECTION_HEADING);
  const withoutOperators =
    operatorIndex === -1 ? markdown : lines.slice(0, operatorIndex).join('\n');
  return stripLeadingH1(withoutOperators).trim();
}

/** Card already shows title/version – drop a leading `# …` from the markdown body. */
function stripLeadingH1(markdown: string): string {
  const lines = markdown.split('\n');
  let index = 0;
  while (index < lines.length && lines[index]?.trim() === '') index += 1;
  if (index < lines.length && /^#\s+/.test(lines[index] ?? '')) {
    index += 1;
    while (index < lines.length && lines[index]?.trim() === '') index += 1;
  }
  return lines.slice(index).join('\n');
}

function markdownForVersion(version: string): string {
  const entry = Object.entries(releaseMarkdownModules).find(([path]) =>
    path.endsWith(`/${version}.md`)
  );
  const raw = entry?.[1];
  return typeof raw === 'string' ? userFacingMarkdown(raw) : '';
}

/**
 * Release notes for the marketing changelog, loaded at build/dev time from
 * `content/releases/` (same SSoT as app `/whats-new`).
 */
export function getLandingReleases(): LandingRelease[] {
  return [...manifestJson.releases]
    .sort((a, b) => compareSemVerDesc(a.version, b.version))
    .map((entry) => ({
      ...entry,
      markdown: markdownForVersion(entry.version),
    }));
}

export function formatReleaseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
