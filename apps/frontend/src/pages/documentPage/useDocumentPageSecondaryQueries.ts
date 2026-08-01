import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { ContextOption, DocumentScope, PdfExportJobStatusResponse } from './documentPageTypes';

function ownerListQuery(scope: DocumentScope | null | undefined): string | null {
  if (scope == null) return null;
  if (scope.type === 'personal') return 'ownerUserId=me';
  if (scope.type === 'company') return `companyId=${scope.id}`;
  if (scope.type === 'department') return `departmentId=${scope.id}`;
  if (scope.type === 'team') return `teamId=${scope.id}`;
  return null;
}

export function useDocumentPageSecondaryQueries(args: {
  documentId: string | undefined;
  contextOwnerId: string | null;
  documentScope: DocumentScope | null | undefined;
  currentContextId: string | null | undefined;
  isTabVisible: boolean;
  assignContextOpened: boolean;
  moveContextOpened: boolean;
  pdfExportJobId: string | null;
}) {
  const {
    documentId,
    contextOwnerId,
    documentScope,
    currentContextId,
    isTabVisible,
    assignContextOpened,
    moveContextOpened,
    pdfExportJobId,
  } = args;

  const { data: tagsData } = useQuery({
    queryKey: ['tags', contextOwnerId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/tags?ownerId=${contextOwnerId}`);
      if (!res.ok) throw new Error('Failed to load tags');
      return res.json() as Promise<{ id: string; name: string }[]>;
    },
    enabled: !!contextOwnerId,
  });

  const { data: assignContextsData } = useQuery({
    queryKey: ['processes', 'projects', 'ownerUserId=me', 'for-assign'],
    queryFn: async () => {
      const [procRes, projRes] = await Promise.all([
        apiFetch('/api/v1/processes?limit=100&offset=0&ownerUserId=me'),
        apiFetch('/api/v1/projects?limit=100&offset=0&ownerUserId=me'),
      ]);
      const processes = procRes.ok
        ? ((await procRes.json()) as { items: { id: string; contextId: string; name: string }[] })
            .items
        : [];
      const projects = projRes.ok
        ? ((await projRes.json()) as { items: { id: string; contextId: string; name: string }[] })
            .items
        : [];
      const options: ContextOption[] = [
        ...processes.map((p) => ({
          id: p.id,
          contextId: p.contextId,
          name: p.name,
          kind: 'process' as const,
        })),
        ...projects.map((p) => ({
          id: p.id,
          contextId: p.contextId,
          name: p.name,
          kind: 'project' as const,
        })),
      ];
      return options;
    },
    enabled: assignContextOpened && !!documentId,
  });

  const ownerQuery = ownerListQuery(documentScope);
  const { data: moveContextsData } = useQuery({
    queryKey: ['processes', 'projects', 'for-move', ownerQuery, contextOwnerId],
    queryFn: async () => {
      type OwnerInfo = { id: string; displayName?: string | null };
      type ProcessItem = {
        id: string;
        contextId: string;
        name: string;
        owner?: OwnerInfo;
      };
      type ProjectItem = {
        id: string;
        contextId: string;
        name: string;
        owner?: OwnerInfo;
        subcontexts?: { id: string; contextId: string; name: string }[];
      };

      const loadPair = async (query: string | null) => {
        const qs = query ? `&${query}` : '';
        const [procRes, projRes] = await Promise.all([
          apiFetch(`/api/v1/processes?limit=100&offset=0${qs}`),
          apiFetch(`/api/v1/projects?limit=100&offset=0${qs}`),
        ]);
        const processes = procRes.ok
          ? ((await procRes.json()) as { items: ProcessItem[] }).items
          : [];
        const projects = projRes.ok
          ? ((await projRes.json()) as { items: ProjectItem[] }).items
          : [];
        return { processes, projects };
      };

      const sameOwner = await loadPair(ownerQuery);
      const crossOwner =
        ownerQuery != null ? await loadPair(null) : { processes: [], projects: [] };

      const byContextId = new Map<string, ContextOption>();
      const addOptions = (processes: ProcessItem[], projects: ProjectItem[]) => {
        for (const p of processes) {
          byContextId.set(p.contextId, {
            id: p.id,
            contextId: p.contextId,
            name: p.name,
            kind: 'process',
            ownerId: p.owner?.id ?? null,
            ownerDisplayName: p.owner?.displayName?.trim() || null,
          });
        }
        for (const p of projects) {
          byContextId.set(p.contextId, {
            id: p.id,
            contextId: p.contextId,
            name: p.name,
            kind: 'project',
            ownerId: p.owner?.id ?? null,
            ownerDisplayName: p.owner?.displayName?.trim() || null,
          });
          for (const s of p.subcontexts ?? []) {
            byContextId.set(s.contextId, {
              id: s.id,
              contextId: s.contextId,
              name: `${p.name} / ${s.name}`,
              kind: 'project',
              ownerId: p.owner?.id ?? null,
              ownerDisplayName: p.owner?.displayName?.trim() || null,
            });
          }
        }
      };
      addOptions(sameOwner.processes, sameOwner.projects);
      addOptions(crossOwner.processes, crossOwner.projects);

      return [...byContextId.values()].filter((o) => o.contextId !== currentContextId);
    },
    enabled: moveContextOpened && !!documentId,
  });

  const { data: pdfExportStatus } = useQuery<PdfExportJobStatusResponse>({
    queryKey: ['document-export-pdf-status', documentId, pdfExportJobId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/documents/${documentId}/export-pdf/${pdfExportJobId}`);
      if (!res.ok) throw new Error('Failed to load PDF export status');
      return res.json() as Promise<PdfExportJobStatusResponse>;
    },
    enabled: !!documentId && !!pdfExportJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'running') {
        return isTabVisible ? 5000 : 30_000;
      }
      return false;
    },
    refetchIntervalInBackground: true,
  });

  const tags = tagsData ?? [];
  const tagOptions = tags.map((t) => ({ value: t.id, label: t.name }));
  const assignContextOptions = (assignContextsData ?? []).map((c) => ({
    value: c.contextId,
    label: `${c.kind === 'process' ? 'Process' : 'Project'}: ${c.name}`,
  }));
  const moveContextOptions = (moveContextsData ?? []).map((c) => {
    const sameOwner = contextOwnerId != null && c.ownerId === contextOwnerId;
    const prefix = c.kind === 'process' ? 'Process' : 'Project';
    const approver = c.ownerDisplayName?.trim();
    const suffix =
      sameOwner || c.ownerId == null
        ? ''
        : approver
          ? ` (approval: ${approver})`
          : ' (requires approval)';
    return {
      value: c.contextId,
      label: `${prefix}: ${c.name}${suffix}`,
      ownerId: c.ownerId ?? null,
    };
  });

  return {
    tags,
    tagOptions,
    assignContextOptions,
    moveContextOptions,
    pdfExportStatus,
  };
}
