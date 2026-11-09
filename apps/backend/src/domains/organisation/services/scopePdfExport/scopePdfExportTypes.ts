import type { ScopePdfOwnerKind } from './scopePdfExportPath.js';

export type ScopePdfOwnerRef =
  | { kind: 'company'; companyId: string; scopeName: string }
  | { kind: 'department'; departmentId: string; scopeName: string }
  | { kind: 'team'; teamId: string; scopeName: string };

/** Owner ids without display name (resolved later). */
export type ScopePdfOwnerRefIds =
  | { kind: 'company'; companyId: string }
  | { kind: 'department'; departmentId: string }
  | { kind: 'team'; teamId: string };

export type ListedScopePdfDoc = {
  documentId: string;
  versionId: string;
  title: string;
  pdfObjectKey: string | null;
  ownerKind: ScopePdfOwnerKind;
  scopeName: string;
  contextKind: 'process' | 'project';
  contextName: string;
  subcontextName: string | null;
};

/** Keep last N successful (or finished) runs per user. */
export const SCOPE_PDF_EXPORT_RETENTION_PER_USER = 5;
