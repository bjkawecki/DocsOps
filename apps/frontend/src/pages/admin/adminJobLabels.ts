import type { TFunction } from 'i18next';

export type AdminJobLabel = {
  technicalName: string;
  label: string;
  description: string;
};

const ADMIN_SCHEDULABLE_JOB_TRANSLATION_KEYS: Record<string, string> = {
  'search.reindex.full': 'searchReindexFull',
  'maintenance.cleanup': 'maintenanceCleanup',
  'maintenance.backup': 'maintenanceBackup',
};

export function getAdminJobLabel(jobName: string, t: TFunction): AdminJobLabel {
  const key = ADMIN_SCHEDULABLE_JOB_TRANSLATION_KEYS[jobName];
  if (!key) {
    return { technicalName: jobName, label: jobName, description: '' };
  }
  return {
    technicalName: jobName,
    label: t(`jobs.definitions.${key}.label`),
    description: t(`jobs.definitions.${key}.description`),
  };
}
