export type TrashArchiveItem = {
  type: 'document' | 'process' | 'project';
  id: string;
  /** Context row id for process/project SPA links (`/contexts/:contextId`). */
  contextId?: string;
  displayTitle: string;
  contextName: string;
  deletedAt?: string;
  archivedAt?: string;
};

export type TrashArchiveScope = 'personal' | 'company' | 'department' | 'team';

export interface TrashArchiveTabBaseProps {
  scope: TrashArchiveScope;
  companyId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
}
