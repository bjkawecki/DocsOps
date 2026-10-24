import type { TranslateFn } from './adminBackupTypes';

const KNOWN_BACKUP_ERROR_CODES = [
  'BACKUP_PG_DUMP_VERSION_MISMATCH',
  'BACKUP_PG_DUMP_NOT_FOUND',
  'BACKUP_PG_DUMP_FAILED',
] as const;

type KnownBackupErrorCode = (typeof KNOWN_BACKUP_ERROR_CODES)[number];

function isKnownBackupErrorCode(value: string): value is KnownBackupErrorCode {
  return (KNOWN_BACKUP_ERROR_CODES as readonly string[]).includes(value);
}

/** Map stable backend error codes (and legacy raw strings) to admin i18n. */
export function formatBackupErrorMessage(
  errorMessage: string | null | undefined,
  t: TranslateFn
): string {
  if (!errorMessage?.trim()) return t('backup.toasts.unknownError');
  const trimmed = errorMessage.trim();
  if (isKnownBackupErrorCode(trimmed)) {
    return t(`backup.errors.${trimmed}`);
  }
  if (/server version mismatch|pg_dump version/i.test(trimmed)) {
    return t('backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH');
  }
  if (/pg_dump not found/i.test(trimmed)) {
    return t('backup.errors.BACKUP_PG_DUMP_NOT_FOUND');
  }
  return trimmed;
}
