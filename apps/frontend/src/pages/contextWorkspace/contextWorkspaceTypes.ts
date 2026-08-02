export type ContextType = 'process' | 'project' | 'subcontext';

export type OwnerResponse = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  ownerUserId?: string | null;
  displayName?: string | null;
};

export type SubcontextSummary = { id: string; name: string; contextId: string };
export type ParentProjectSummary = { id: string; name: string; contextId: string };

export type ContextResponse = {
  id: string;
  contextType: ContextType;
  name: string;
  entityId: string;
  ownerId?: string;
  owner: OwnerResponse;
  canWriteContext?: boolean;
  subcontexts?: SubcontextSummary[];
  parentProject?: ParentProjectSummary;
};

export type ContextDocument = {
  id: string;
  title: string;
  updatedAt: string;
  documentTags: { tag: { id: string; name: string } }[];
};

/** Base API path for the entity behind a Context (process/project/subcontext mutations). */
export function entityEndpointBase(contextType: ContextType): string {
  if (contextType === 'process') return '/api/v1/processes';
  if (contextType === 'project') return '/api/v1/projects';
  return '/api/v1/subcontexts';
}
