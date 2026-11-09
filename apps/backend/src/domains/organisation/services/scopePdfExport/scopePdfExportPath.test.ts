import { describe, expect, it } from 'vitest';
import {
  CORPUS_COMPANY_DIR,
  CORPUS_DEPARTMENTS_DIR,
  CORPUS_PROCESS_DIR,
  CORPUS_PROJECT_DIR,
  CORPUS_TEAMS_DIR,
  buildScopePdfArchiveFileName,
  buildScopePdfRelativePath,
  scopePdfArchiveFileNameFromObjectKey,
  slugifyPathSegment,
} from './scopePdfExportPath.js';

describe('buildScopePdfRelativePath', () => {
  it('uses Company/Prozesse for company owner', () => {
    expect(
      buildScopePdfRelativePath({
        ownerKind: 'company',
        contextKind: 'process',
        contextName: 'Unternehmensprozesse',
        documentTitle: 'Dokumentationsrichtlinie',
        documentId: 'xxxxxxxxnzep9xl4',
      })
    ).toBe(
      `${CORPUS_COMPANY_DIR}/${CORPUS_PROCESS_DIR}/unternehmensprozesse/dokumentationsrichtlinie-nzep9xl4.pdf`
    );
  });

  it('nests department under Departments/', () => {
    const path = buildScopePdfRelativePath({
      ownerKind: 'department',
      scopeName: 'Produktentwicklung',
      contextKind: 'project',
      contextName: 'Roadmap',
      documentTitle: 'Q3',
      documentId: 'xxxxxxxxuc8eyh95',
    });
    expect(path).toBe(
      `${CORPUS_DEPARTMENTS_DIR}/produktentwicklung/${CORPUS_PROJECT_DIR}/roadmap/q3-uc8eyh95.pdf`
    );
    expect(path).not.toContain('/teams/');
  });

  it('nests team under Teams/ (not under department)', () => {
    const path = buildScopePdfRelativePath({
      ownerKind: 'team',
      scopeName: 'Barrierefreiheit',
      contextKind: 'process',
      contextName: 'Leitfaden',
      documentTitle: 'Stand',
      documentId: 'xxxxxxxx2qllcekd',
    });
    expect(path).toBe(
      `${CORPUS_TEAMS_DIR}/barrierefreiheit/${CORPUS_PROCESS_DIR}/leitfaden/stand-2qllcekd.pdf`
    );
    expect(path.startsWith(`${CORPUS_TEAMS_DIR}/`)).toBe(true);
  });
});

describe('slugifyPathSegment', () => {
  it('slugifies empty input to unnamed', () => {
    expect(slugifyPathSegment('   ')).toBe('unnamed');
  });
});

describe('buildScopePdfArchiveFileName', () => {
  it('uses company|departments|teams kind and UTC timestamp', () => {
    const at = new Date(Date.UTC(2026, 10, 9, 13, 47, 5));
    expect(buildScopePdfArchiveFileName('company', at)).toBe(
      'docsops-pdf-company-2026-11-09-134705.zip'
    );
    expect(buildScopePdfArchiveFileName('department', at)).toBe(
      'docsops-pdf-departments-2026-11-09-134705.zip'
    );
    expect(buildScopePdfArchiveFileName('team', at)).toBe(
      'docsops-pdf-teams-2026-11-09-134705.zip'
    );
  });

  it('reads basename from object key', () => {
    expect(
      scopePdfArchiveFileNameFromObjectKey(
        'scope-pdf-export/abc/docsops-pdf-company-2026-11-09-134705.zip'
      )
    ).toBe('docsops-pdf-company-2026-11-09-134705.zip');
  });
});
