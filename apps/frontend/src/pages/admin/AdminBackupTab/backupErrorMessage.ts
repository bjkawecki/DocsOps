import type { TranslateFn } from './adminBackupTypes';

const KNOWN_BACKUP_ERROR_CODES = [
  'BACKUP_PG_DUMP_VERSION_MISMATCH',
  'BACKUP_PG_DUMP_NOT_FOUND',
  'BACKUP_PG_DUMP_FAILED',
] as const;

type KnownBackupErrorCode = (typeof KNOWN_BACKUP_ERROR_CODES)[number];

export type FormatBackupErrorOptions = {
  /** History popover: include safe version detail when present. Toast stays short. */
  detailed?: boolean;
};

function isKnownBackupErrorCode(value: string): value is KnownBackupErrorCode {
  return (KNOWN_BACKUP_ERROR_CODES as readonly string[]).includes(value);
}

function extractVersionPair(text: string): { serverVersion: string; pgDumpVersion: string } | null {
  const match = text.match(/server version:\s*([\d.]+)\s*;\s*pg_dump version:\s*([\d.]+)/i);
  const serverVersion = match?.[1];
  const pgDumpVersion = match?.[2];
  if (!serverVersion || !pgDumpVersion) return null;
  return { serverVersion, pgDumpVersion };
}

function resolveKnownCode(trimmed: string): KnownBackupErrorCode | null {
  const firstLine = trimmed.split('\n')[0]?.trim() ?? trimmed;
  if (isKnownBackupErrorCode(firstLine)) return firstLine;
  if (/server version mismatch|pg_dump version/i.test(trimmed)) {
    return 'BACKUP_PG_DUMP_VERSION_MISMATCH';
  }
  if (/pg_dump not found/i.test(trimmed)) {
    return 'BACKUP_PG_DUMP_NOT_FOUND';
  }
  return null;
}

/** Map stable backend error codes (and legacy raw strings) to admin i18n. */
export function formatBackupErrorMessage(
  errorMessage: string | null | undefined,
  t: TranslateFn,
  options?: FormatBackupErrorOptions
): string {
  if (!errorMessage?.trim()) return t('backup.toasts.unknownError');
  const trimmed = errorMessage.trim();
  const code = resolveKnownCode(trimmed);

  if (code == null) {
    return trimmed;
  }

  const short = t(`backup.errors.${code}`);
  if (!options?.detailed || code !== 'BACKUP_PG_DUMP_VERSION_MISMATCH') {
    return short;
  }

  const versions = extractVersionPair(trimmed);
  if (!versions) {
    return `${short}\n\n${t('backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH_HINT')}`;
  }

  return `${short}\n\n${t('backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH_DETAIL', versions)}`;
}
