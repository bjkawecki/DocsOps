export type AdminJobLabel = {
  technicalName: string;
  label: string;
  description: string;
};

export const ADMIN_SCHEDULABLE_JOB_LABELS: Record<string, AdminJobLabel> = {
  'search.reindex.full': {
    technicalName: 'search.reindex.full',
    label: 'Full search reindex',
    description: 'Rebuilds the search index for all documents.',
  },
  'maintenance.cleanup': {
    technicalName: 'maintenance.cleanup',
    label: 'Notification cleanup',
    description: 'Deletes in-app notifications older than the retention window.',
  },
  'maintenance.backup': {
    technicalName: 'maintenance.backup',
    label: 'Disaster recovery backup',
    description: 'Full restorable snapshot of database and file storage.',
  },
};

export function getAdminJobLabel(jobName: string): AdminJobLabel {
  return (
    ADMIN_SCHEDULABLE_JOB_LABELS[jobName] ?? {
      technicalName: jobName,
      label: jobName,
      description: '',
    }
  );
}
