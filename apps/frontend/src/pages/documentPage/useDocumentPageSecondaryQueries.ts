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
    queryKey: ['processes', 'projects', 'for-move', ownerQuery],
    queryFn: async () => {
      if (!ownerQuery) return [] as ContextOption[];
      const [procRes, projRes] = await Promise.all([
        apiFetch(`/api/v1/processes?limit=100&offset=0&${ownerQuery}`),
        apiFetch(`/api/v1/projects?limit=100&offset=0&${ownerQuery}`),
      ]);
      type ProcessItem = { id: string; contextId: string; name: string };
      type ProjectItem = {
        id: string;
        contextId: string;
        name: string;
        subcontexts?: { id: string; contextId: string; name: string }[];
      };
      const processes = procRes.ok
        ? ((await procRes.json()) as { items: ProcessItem[] }).items
        : [];
      const projects = projRes.ok ? ((await projRes.json()) as { items: ProjectItem[] }).items : [];
      const options: ContextOption[] = [
        ...processes.map((p) => ({
          id: p.id,
          contextId: p.contextId,
          name: p.name,
          kind: 'process' as const,
        })),
        ...projects.flatMap((p) => {
          const projectOpt: ContextOption = {
            id: p.id,
            contextId: p.contextId,
            name: p.name,
            kind: 'project',
          };
          const subOpts: ContextOption[] = (p.subcontexts ?? []).map((s) => ({
            id: s.id,
            contextId: s.contextId,
            name: `${p.name} / ${s.name}`,
            kind: 'project' as const,
          }));
          return [projectOpt, ...subOpts];
        }),
      ];
      return options.filter((o) => o.contextId !== currentContextId);
    },
    enabled: moveContextOpened && !!documentId && !!ownerQuery,
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
  const moveContextOptions = (moveContextsData ?? []).map((c) => ({
    value: c.contextId,
    label: `${c.kind === 'process' ? 'Process' : 'Project'}: ${c.name}`,
  }));

  return {
    tags,
    tagOptions,
    assignContextOptions,
    moveContextOptions,
    pdfExportStatus,
  };
}
