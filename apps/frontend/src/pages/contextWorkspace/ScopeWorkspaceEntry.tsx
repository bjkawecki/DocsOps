import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { CreateContextMenu, NewContextModal, NewDocumentModal } from '../../components/contexts';
import type { NewContextScope } from '../../components/contexts/NewContextModal';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';
import { contextUrl, readLastScopeContextId, scopeToOwnerQueryParams } from './contextPaths.js';

type SiblingEntityItem = { id: string; name: string; contextId: string };

/** RecentScope → NewContextModal/NewDocumentModal scope. `null` for scopes without an owner (Shared). */
function toNewContextScope(scope: RecentScope): NewContextScope | null {
  if (scope.type === 'company') return { type: 'company', companyId: scope.id };
  if (scope.type === 'department') return { type: 'department', departmentId: scope.id };
  if (scope.type === 'team') return { type: 'team', teamId: scope.id };
  if (scope.type === 'personal') return { type: 'personal' };
  return null;
}

export type ScopeWorkspaceEntryProps = {
  scope: RecentScope;
  /** Display name for the scope crumb (e.g. company/dept name). */
  scopeLabel?: string;
  /** Whether the current user may create processes/projects/drafts in this scope. */
  canManage?: boolean;
};

/**
 * Landing point for a scope (Company/Department/Team/Personal): picks the last visited context
 * (or the first available process/project) and redirects into `ContextWorkspacePage`.
 * With no processes/projects yet, shows an empty state with create actions instead.
 */
export function ScopeWorkspaceEntry({
  scope,
  scopeLabel,
  canManage = false,
}: ScopeWorkspaceEntryProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scopeKey = scopeToKey(scope);
  const newContextScope = toNewContextScope(scope);

  const [contextModalOpened, { open: openContextModal, close: closeContextModal }] =
    useDisclosure(false);
  const [documentModalOpened, { open: openDocumentModal, close: closeDocumentModal }] =
    useDisclosure(false);
  const [contextInitialType, setContextInitialType] = useState<'process' | 'project' | undefined>(
    undefined
  );

  const ownerParams = scopeToOwnerQueryParams(scope);
  const { data: processesData, isPending: processesPending } = useQuery({
    queryKey: ['processes', 'entry', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/processes?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load processes');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });
  const { data: projectsData, isPending: projectsPending } = useQuery({
    queryKey: ['projects', 'entry', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/projects?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load projects');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });
  const isPending = ownerParams != null && (processesPending || projectsPending);

  const targetContextId = useMemo(() => {
    if (isPending) return undefined;
    const processes = processesData?.items ?? [];
    const projects = projectsData?.items ?? [];
    const lastId = readLastScopeContextId(scopeKey);
    const allIds = new Set([
      ...processes.map((p) => p.contextId),
      ...projects.map((p) => p.contextId),
    ]);
    if (lastId && allIds.has(lastId)) return lastId;
    if (processes[0]) return processes[0].contextId;
    if (projects[0]) return projects[0].contextId;
    return null;
  }, [isPending, scopeKey, processesData, projectsData]);

  useEffect(() => {
    if (targetContextId) void navigate(contextUrl(targetContextId), { replace: true });
  }, [targetContextId, navigate]);

  const invalidateContexts = () => {
    void queryClient.invalidateQueries({ queryKey: ['processes', 'entry', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'entry', scopeKey] });
  };

  const chromeActions = useMemo(() => {
    if (!canManage || newContextScope == null) return null;
    return (
      <CreateContextMenu
        onCreateProcess={() => {
          setContextInitialType('process');
          openContextModal();
        }}
        onCreateProject={() => {
          setContextInitialType('project');
          openContextModal();
        }}
        onCreateDraft={openDocumentModal}
      />
    );
  }, [canManage, newContextScope, openContextModal, openDocumentModal]);
  // Hooks must run every render (before Loader early-return) – syncKey in chrome avoids action loops.
  useRegisterScopePageChrome(scope, scopeLabel, chromeActions);

  if (isPending || targetContextId) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Box maw={480}>
      <Stack gap="xs">
        <Text fw={600}>No processes or projects yet</Text>
        <Text size="sm" c="dimmed">
          {canManage
            ? 'Create a process or project to get started, or a draft document.'
            : 'There are no processes or projects in this scope yet.'}
        </Text>
      </Stack>

      {newContextScope != null && (
        <>
          <NewContextModal
            opened={contextModalOpened}
            onClose={closeContextModal}
            scope={newContextScope}
            onSuccess={invalidateContexts}
            initialType={contextInitialType}
          />
          <NewDocumentModal
            opened={documentModalOpened}
            onClose={closeDocumentModal}
            scope={newContextScope}
            onSuccess={invalidateContexts}
            allowNoContext={scope.type === 'personal'}
          />
        </>
      )}
    </Box>
  );
}
