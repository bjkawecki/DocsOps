export type PlatformExportRun = {
  id: string;
  status: string;
  triggeredByUserId: string | null;
  archiveSha256: string | null;
  sizeBytes: number | null;
  localObjectKey: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  manifestJson?: {
    sourceAppVersion?: string;
    counts?: {
      documents?: number;
      users?: number;
      attachmentFiles?: number;
    };
  } | null;
};

export type PlatformImportPreflight = {
  ok: boolean;
  exportFormatVersion?: number;
  sourceAppVersion?: string;
  counts?: {
    companies?: number;
    users?: number;
    documents?: number;
    attachmentFiles?: number;
  };
  targetEmpty: boolean;
  targetAppVersion: string;
  sameAppVersion: boolean;
  errors: string[];
  warnings: string[];
};

export type PlatformImportRun = {
  id: string;
  status: string;
  source: string;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  preflightJson: PlatformImportPreflight | null;
  optionsJson: unknown;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type PlatformMigrationStatus = {
  minioAvailable: boolean;
  workerConnected: boolean;
  maintenanceActive: boolean;
  maintenanceReason: 'backup' | 'restore' | 'platform-import' | null;
  instanceEmpty: boolean;
  instanceCounts: {
    companies: number;
    departments: number;
    teams: number;
    users: number;
    contexts: number;
    processes: number;
    projects: number;
    subcontexts: number;
    documents: number;
    attachmentFiles: number;
  };
  activeExportRun: PlatformExportRun | null;
  lastExportRun: PlatformExportRun | null;
  activeImportRun: PlatformImportRun | null;
  lastImportRun: PlatformImportRun | null;
};

export const IN_PROGRESS_PLATFORM_EXPORT_STATUSES = ['queued', 'running', 'packaging'] as const;

export const IN_PROGRESS_PLATFORM_IMPORT_STATUSES = [
  'queued',
  'running',
  'importing_organization',
  'importing_users',
  'importing_owners',
  'importing_contexts',
  'importing_documents',
  'importing_versions',
  'importing_tags',
  'importing_grants',
  'importing_pins',
  'importing_comments',
  'importing_files',
] as const;

export const FAILED_PLATFORM_IMPORT_STATUSES = ['failed', 'preflight_failed'] as const;

export function isInProgressPlatformExportStatus(status: string): boolean {
  return (IN_PROGRESS_PLATFORM_EXPORT_STATUSES as readonly string[]).includes(status);
}

export function isInProgressPlatformImportStatus(status: string): boolean {
  return (IN_PROGRESS_PLATFORM_IMPORT_STATUSES as readonly string[]).includes(status);
}

export function isFailedPlatformImportStatus(status: string): boolean {
  return (FAILED_PLATFORM_IMPORT_STATUSES as readonly string[]).includes(status);
}

export function formatPlatformImportStatus(status: string): string {
  return status.replace(/^importing_/, 'Importing ').replace(/_/g, ' ');
}

export function formatPlatformExportStatus(status: string): string {
  if (status === 'packaging') return 'Packaging archive';
  if (status === 'running') return 'Exporting domain data';
  if (status === 'queued') return 'Queued';
  return status;
}

export const PLATFORM_IMPORT_PHASE_ORDER = [...IN_PROGRESS_PLATFORM_IMPORT_STATUSES] as const;

export type ImportPhaseProgress = {
  phases: readonly string[];
  currentIndex: number;
  isTerminal: boolean;
  isFailed: boolean;
};

export function getImportPhaseProgress(status: string): ImportPhaseProgress {
  const phases = PLATFORM_IMPORT_PHASE_ORDER;
  const phaseIndex = phases.indexOf(status as (typeof phases)[number]);

  if (status === 'succeeded') {
    return {
      phases,
      currentIndex: phases.length,
      isTerminal: true,
      isFailed: false,
    };
  }

  if (status === 'failed' || status === 'preflight_failed') {
    return {
      phases,
      currentIndex: phases.length - 1,
      isTerminal: true,
      isFailed: true,
    };
  }

  if (phaseIndex >= 0) {
    return {
      phases,
      currentIndex: phaseIndex,
      isTerminal: false,
      isFailed: false,
    };
  }

  return {
    phases,
    currentIndex: 0,
    isTerminal: false,
    isFailed: false,
  };
}

export function formatPlatformRunStatus(status: string, kind: 'export' | 'import'): string {
  if (status === 'succeeded') return 'Succeeded';
  if (status === 'failed') return 'Failed';
  if (status === 'preflight_failed') return 'Preflight failed';
  if (status === 'awaiting_confirm') return 'Awaiting confirm';
  if (kind === 'export') return formatPlatformExportStatus(status);
  return formatPlatformImportStatus(status);
}

export function getPlatformRunStatusColor(status: string): string {
  if (status === 'succeeded') return 'green';
  if (status === 'failed' || status === 'preflight_failed') return 'red';
  return 'blue';
}

export type MigrationRunCounts = {
  companies?: number;
  departments?: number;
  teams?: number;
  users?: number;
  contexts?: number;
  processes?: number;
  projects?: number;
  subcontexts?: number;
  documents?: number;
  attachmentFiles?: number;
};

export type PlatformInstanceCounts = PlatformMigrationStatus['instanceCounts'];

export function formatBytes(sizeBytes: number | null | undefined): string {
  if (sizeBytes == null) return '—';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
