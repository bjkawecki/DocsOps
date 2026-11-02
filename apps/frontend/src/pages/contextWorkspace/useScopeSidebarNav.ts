import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client.js';
import { useMeDrafts } from '../../hooks/useMeDrafts.js';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';
import type {
  SidebarContextItem,
  SidebarDraftItem,
  SidebarProjectItem,
} from './ScopeContextSidebar.js';
import { scopeToDraftsParams, scopeToOwnerQueryParams } from './contextPaths.js';

type SiblingEntityItem = {
  id: string;
  name: string;
  contextId: string;
  subcontexts?: { id: string; name: string; contextId: string }[];
};

export type ScopeSidebarNav = {
  processes: SidebarContextItem[];
  projects: SidebarProjectItem[];
  drafts: SidebarDraftItem[];
  scopeKey: string | null;
};

/**
 * Loads Processes / Projects / Drafts for the left scope chrome
 * (Context workspace and Trash/Archive pages).
 */
export function useScopeSidebarNav(scope: RecentScope | null): ScopeSidebarNav {
  const scopeKey = scope == null ? null : scopeToKey(scope);
  const ownerParams = scope ? scopeToOwnerQueryParams(scope) : null;

  const { data: processesData } = useQuery({
    queryKey: ['processes', 'siblings', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/processes?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load processes');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'siblings', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/projects?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load projects');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });

  const draftsParams = scope ? scopeToDraftsParams(scope) : null;
  const { data: draftsData } = useMeDrafts(draftsParams ?? {}, {
    limit: 8,
    enabled: draftsParams != null,
  });

  const processes: SidebarContextItem[] = (processesData?.items ?? []).map((p) => ({
    contextId: p.contextId,
    name: p.name,
  }));

  const projects: SidebarProjectItem[] = (projectsData?.items ?? []).map((p) => ({
    contextId: p.contextId,
    name: p.name,
    subcontexts: (p.subcontexts ?? []).map((s) => ({
      contextId: s.contextId,
      name: s.name,
    })),
  }));

  const drafts: SidebarDraftItem[] = (draftsData?.draftDocuments ?? []).map((d) => ({
    id: d.id,
    title: d.title,
  }));

  return { processes, projects, drafts, scopeKey };
}
