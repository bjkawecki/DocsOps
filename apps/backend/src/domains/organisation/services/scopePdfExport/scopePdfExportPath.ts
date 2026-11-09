/** Path helpers for lead-triggered scope PDF zip layout. */

export type ScopePdfOwnerKind = 'company' | 'department' | 'team';

export function slugifyPathSegment(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const slug = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug.length > 0 ? slug : 'unnamed';
}

export function shortIdSuffix(id: string): string {
  return id.slice(-8);
}

/** Filename segment for export root: company | departments | teams. */
export function scopePdfArchiveKindSegment(kind: ScopePdfOwnerKind): string {
  if (kind === 'company') return 'company';
  if (kind === 'department') return 'departments';
  return 'teams';
}

/**
 * Download / object basename: docsops-pdf-<company|departments|teams>-YYYY-MM-DD-HHmmss.zip (UTC).
 */
export function buildScopePdfArchiveFileName(
  kind: ScopePdfOwnerKind,
  at: Date = new Date()
): string {
  const scope = scopePdfArchiveKindSegment(kind);
  const y = at.getUTCFullYear();
  const mo = String(at.getUTCMonth() + 1).padStart(2, '0');
  const d = String(at.getUTCDate()).padStart(2, '0');
  const h = String(at.getUTCHours()).padStart(2, '0');
  const mi = String(at.getUTCMinutes()).padStart(2, '0');
  const s = String(at.getUTCSeconds()).padStart(2, '0');
  return `docsops-pdf-${scope}-${y}-${mo}-${d}-${h}${mi}${s}.zip`;
}

/** Prefer the stored object basename; fall back to a timestamp name. */
export function scopePdfArchiveFileNameFromObjectKey(
  objectKey: string | null | undefined,
  kindFallback: ScopePdfOwnerKind = 'company'
): string {
  if (objectKey) {
    const base = objectKey.split('/').pop()?.trim();
    if (base && base.toLowerCase().endsWith('.zip')) return base;
  }
  return buildScopePdfArchiveFileName(kindFallback);
}

export const CORPUS_PROCESS_DIR = 'Prozesse';
export const CORPUS_PROJECT_DIR = 'Projekte';
export const CORPUS_COMPANY_DIR = 'Company';
export const CORPUS_DEPARTMENTS_DIR = 'Departments';
export const CORPUS_TEAMS_DIR = 'Teams';

export type ScopePdfPathInput = {
  ownerKind: ScopePdfOwnerKind;
  /** Department or team display name when ownerKind is department/team. */
  scopeName?: string | null;
  contextKind: 'process' | 'project';
  contextName: string;
  subcontextName?: string | null;
  documentTitle: string;
  documentId: string;
};

/**
 * Relative path for one document by its actual owner (not the export root).
 * Company export may mix Company/, Departments/<dept>/, and Teams/<team>/ branches.
 */
export function buildScopePdfRelativePath(input: ScopePdfPathInput): string {
  const parts: string[] = [];

  if (input.ownerKind === 'company') {
    parts.push(CORPUS_COMPANY_DIR);
  } else if (input.ownerKind === 'department') {
    parts.push(CORPUS_DEPARTMENTS_DIR, slugifyPathSegment(input.scopeName ?? 'department'));
  } else {
    parts.push(CORPUS_TEAMS_DIR, slugifyPathSegment(input.scopeName ?? 'team'));
  }

  parts.push(input.contextKind === 'process' ? CORPUS_PROCESS_DIR : CORPUS_PROJECT_DIR);
  parts.push(slugifyPathSegment(input.contextName));

  if (input.contextKind === 'project' && input.subcontextName) {
    parts.push(slugifyPathSegment(input.subcontextName));
  }

  const fileName = `${slugifyPathSegment(input.documentTitle)}-${shortIdSuffix(input.documentId)}.pdf`;
  parts.push(fileName);
  return parts.join('/');
}
