/**
 * Shared API shapes for platform export/import runs (list, detail, migration status).
 */

export type PlatformExportRunRow = {
  id: string;
  status: string;
  triggeredByUserId: string | null;
  archiveSha256: string | null;
  sizeBytes: bigint | null;
  localObjectKey: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  manifestJson: unknown;
};

export type PlatformImportRunRow = {
  id: string;
  status: string;
  source: string;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  preflightJson: unknown;
  optionsJson: unknown;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};

export function serializePlatformExportRun(run: PlatformExportRunRow) {
  return {
    id: run.id,
    status: run.status,
    triggeredByUserId: run.triggeredByUserId,
    archiveSha256: run.archiveSha256,
    sizeBytes: run.sizeBytes != null ? Number(run.sizeBytes) : null,
    localObjectKey: run.localObjectKey,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
    manifestJson: run.manifestJson,
  };
}

export function serializePlatformImportRun(run: PlatformImportRunRow) {
  return {
    id: run.id,
    status: run.status,
    source: run.source,
    uploadObjectKey: run.uploadObjectKey,
    triggeredByUserId: run.triggeredByUserId,
    preflightJson: run.preflightJson,
    optionsJson: run.optionsJson,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
  };
}
