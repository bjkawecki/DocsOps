import { ActionIcon, Box, Button, Container, Group, Menu, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { IconArchive, IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { useRecentItemsActions, type RecentScope } from '../../hooks/useRecentItems';
import {
  deriveOwnerScopeCanManage,
  ownerToScopeForBreadcrumb,
  scopeToLabel,
} from '../../lib/scopeNav';
import { scopeToKey } from '../../hooks/useRecentItems';
import { ContentLink } from '../../components/ui/ContentLink';
import { SectionLabel } from '../../components/ui/SectionLabel';
import {
  ContextDocumentsTable,
  readDocsListLimit,
  readDocsListPage,
} from '../../components/contexts/ContextDocumentsTable';
import { useSetAppShellBreadcrumbs } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import {
  buildContextBreadcrumbs,
  scopeBreadcrumbItem,
} from '../../components/appShell/scopeBreadcrumbs.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import {
  contextUrl,
  scopeArchiveUrl,
  scopeMostReadUrl,
  scopeTrashUrl,
  writeLastScopeContextId,
} from './contextPaths.js';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';
import { ContextWorkspaceModals } from './ContextWorkspaceModals.js';
import type { ContextDocument, ContextResponse } from './contextWorkspaceTypes.js';
import { useContextWorkspaceActions } from './useContextWorkspaceActions.js';

export function ContextWorkspacePage() {
  const { t } = useTranslation(['contexts', 'common', 'shell']);
  const { contextId } = useParams<{ contextId: string }>();
  const [searchParams] = useSearchParams();
  const { data: me } = useMe();
  const recentActions = useRecentItemsActions();

  const docsPage = readDocsListPage(searchParams);
  const docsLimit = readDocsListLimit(searchParams);
  const docsOffset = (docsPage - 1) * docsLimit;

  /** False when the user cleared the sidebar selection (re-click active item). */
  const [contextSelected, setContextSelected] = useState(true);

  useEffect(() => {
    setContextSelected(true);
  }, [contextId]);

  const handleContextNavClick = (navContextId: string, event: MouseEvent<HTMLElement>) => {
    if (!contextId) return;
    if (navContextId === contextId) {
      event.preventDefault();
      setContextSelected((selected) => !selected);
    }
  };

  const { data, isPending, isError } = useQuery({
    queryKey: ['context', contextId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/contexts/${contextId}`);
      if (!res.ok) throw new Error('Context not found');
      return res.json() as Promise<ContextResponse>;
    },
    enabled: !!contextId,
    // Keep previous context while the next loads so the sidebar does not unmount/reset.
    placeholderData: (previousData) => previousData,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['contexts', contextId, 'documents', docsLimit, docsOffset],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/v1/contexts/${contextId}/documents?limit=${docsLimit}&offset=${docsOffset}`
      );
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json() as Promise<{
        items: ContextDocument[];
        total: number;
        limit: number;
        offset: number;
      }>;
    },
    enabled: !!contextId,
  });
  const documents = documentsData?.items ?? [];
  const documentsTotal = documentsData?.total ?? 0;

  const { data: tagsData } = useQuery({
    queryKey: ['tags', data?.ownerId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/tags?ownerId=${data?.ownerId}`);
      if (!res.ok) throw new Error('Failed to load tags');
      return res.json() as Promise<{ id: string; name: string }[]>;
    },
    enabled: !!data?.ownerId,
  });
  const tagOptions = (tagsData ?? []).map((tag) => ({ value: tag.id, label: tag.name }));

  const ownerCompanyId = data?.owner.companyId ?? null;
  const ownerDepartmentId = data?.owner.departmentId ?? null;
  const ownerTeamId = data?.owner.teamId ?? null;
  const ownerUserId = data?.owner.ownerUserId ?? null;

  const scope: RecentScope | null = useMemo(
    () =>
      ownerToScopeForBreadcrumb({
        companyId: ownerCompanyId,
        departmentId: ownerDepartmentId,
        teamId: ownerTeamId,
        ownerUserId: ownerUserId,
      }),
    [ownerCompanyId, ownerDepartmentId, ownerTeamId, ownerUserId]
  );
  const scopeName =
    data?.owner.displayName ?? (scope ? scopeToLabel(scope) : t('workspace.overviewFallback'));
  const {
    processes: sidebarProcesses,
    projects: sidebarProjects,
    drafts: sidebarDrafts,
    scopeKey,
  } = useScopeSidebarNav(scope);

  const actions = useContextWorkspaceActions({ contextId, data, scope, scopeKey });

  useEffect(() => {
    if (!data || data.id !== contextId || !recentActions) return;
    if (data.contextType !== 'process' && data.contextType !== 'project') return;
    const itemScope = ownerToScopeForBreadcrumb({
      companyId: ownerCompanyId,
      departmentId: ownerDepartmentId,
      teamId: ownerTeamId,
      ownerUserId: ownerUserId,
    });
    if (itemScope) {
      recentActions.addRecent({ type: data.contextType, id: data.id, name: data.name }, itemScope);
    }
  }, [contextId, data, ownerCompanyId, ownerDepartmentId, ownerTeamId, ownerUserId, recentActions]);

  useEffect(() => {
    if (!data || data.id !== contextId) return;
    const itemScope = ownerToScopeForBreadcrumb({
      companyId: ownerCompanyId,
      departmentId: ownerDepartmentId,
      teamId: ownerTeamId,
      ownerUserId: ownerUserId,
    });
    if (itemScope) writeLastScopeContextId(scopeToKey(itemScope), data.id);
  }, [contextId, data, ownerCompanyId, ownerDepartmentId, ownerTeamId, ownerUserId]);

  const contextReady = data != null && data.id === contextId;
  const showContextDetail = contextReady && contextSelected;

  const breadcrumbItems = useMemo(() => {
    if (!scope) return null;
    if (!showContextDetail || !data) {
      return [scopeBreadcrumbItem(scope, scopeName)];
    }
    if (data.contextType === 'subcontext' && data.parentProject) {
      return buildContextBreadcrumbs({
        scope,
        scopeLabel: scopeName,
        contextType: 'subcontext',
        contextName: data.name,
        parentProject: { contextId: data.parentProject.contextId, name: data.parentProject.name },
      });
    }
    return buildContextBreadcrumbs({
      scope,
      scopeLabel: scopeName,
      contextType: data.contextType,
      contextName: data.name,
    });
  }, [showContextDetail, data, scope, scopeName]);
  useSetAppShellBreadcrumbs(breadcrumbItems);
  useSetAppShellNavScope(scope);

  const scopeCanManage = deriveOwnerScopeCanManage(me, data?.owner);
  const showTrashArchive = canShowTrashArchiveTabs(me, scopeCanManage);
  const trashArchive =
    showTrashArchive && scope != null
      ? {
          trashTo: scopeTrashUrl(scope),
          archiveTo: scopeArchiveUrl(scope),
          mostReadTo: scopeMostReadUrl(scope),
        }
      : null;

  const breadcrumbActions =
    showContextDetail && data?.canWriteContext ? (
      <Group gap="xs">
        <Button variant="filled" size="sm" onClick={actions.openNewDoc}>
          {t('workspace.newDraft')}
        </Button>
        <ActionIcon
          variant="filled"
          size="36"
          aria-label={t('workspace.editContextAriaLabel')}
          onClick={actions.handleEditClick}
        >
          <IconPencil size={18} />
        </ActionIcon>
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="default"
              size="36"
              aria-label={t('workspace.moreActionsAriaLabel')}
            >
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {data.contextType !== 'subcontext' && (
              <>
                <Menu.Item
                  leftSection={<IconArchive size={14} />}
                  onClick={() => void actions.handleArchive()}
                >
                  {t('workspace.archive')}
                </Menu.Item>
                <Menu.Divider />
              </>
            )}
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={actions.openDelete}
            >
              {data.contextType === 'subcontext'
                ? t('workspace.delete')
                : t('workspace.moveToTrash')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    ) : null;

  useSetAppShellBreadcrumbActions(
    breadcrumbActions,
    showContextDetail && data?.canWriteContext
      ? `ctx-actions:${contextId}:${data.contextType}`
      : 'none'
  );

  if (!contextId) return null;

  // First load only – keep the shell mounted while switching contexts (placeholderData).
  if (!data && isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('common:status.loading')}
      </Text>
    );
  }
  if (!data || (isError && !contextReady)) {
    return (
      <Text size="sm" c="red">
        {t('workspace.contextNotFound')}
      </Text>
    );
  }

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <ResponsiveContentNav
          title={t('shell:nav.organization')}
          nav={
            <ScopeContextSidebar
              processes={sidebarProcesses}
              projects={sidebarProjects}
              drafts={sidebarDrafts}
              activeContextId={contextSelected ? contextId : null}
              onContextNavClick={handleContextNavClick}
              trashArchive={trashArchive}
            />
          }
        >
          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {!contextReady ? (
              <Text size="sm" c="dimmed">
                {t('common:status.loading')}
              </Text>
            ) : !contextSelected ? (
              <Text size="sm" c="dimmed">
                {t('workspace.selectPrompt')}
              </Text>
            ) : (
              <Stack gap="xl">
                <Box data-context-docs-table>
                  <ContextDocumentsTable documents={documents} total={documentsTotal} />
                </Box>

                {data.contextType === 'project' && (
                  <Box>
                    <Group justify="space-between" wrap="nowrap" mb="sm">
                      <SectionLabel>{t('workspace.subcontexts')}</SectionLabel>
                      {data.canWriteContext && (
                        <Button variant="filled" size="xs" onClick={actions.openNewSubcontext}>
                          {t('workspace.createSubcontext')}
                        </Button>
                      )}
                    </Group>
                    {(data.subcontexts?.length ?? 0) === 0 ? (
                      <Text size="sm" c="dimmed">
                        {t('workspace.noSubcontexts')}
                      </Text>
                    ) : (
                      <Stack gap={4}>
                        {(data.subcontexts ?? []).map((sub) => (
                          <ContentLink
                            key={sub.id}
                            to={contextUrl(sub.contextId)}
                            style={{ fontSize: 'var(--mantine-font-size-sm)' }}
                          >
                            {sub.name}
                          </ContentLink>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        </ResponsiveContentNav>
      </Paper>

      <ContextWorkspaceModals
        contextId={contextId}
        contextType={data.contextType}
        tagOptions={tagOptions}
        newSubcontextOpened={actions.newSubcontextOpened}
        closeNewSubcontext={actions.closeNewSubcontext}
        newSubcontextName={actions.newSubcontextName}
        setNewSubcontextName={actions.setNewSubcontextName}
        newSubcontextLoading={actions.newSubcontextLoading}
        handleCreateSubcontext={actions.handleCreateSubcontext}
        newDocOpened={actions.newDocOpened}
        closeNewDoc={actions.closeNewDoc}
        newDocTitle={actions.newDocTitle}
        setNewDocTitle={actions.setNewDocTitle}
        newDocTagIds={actions.newDocTagIds}
        setNewDocTagIds={actions.setNewDocTagIds}
        newDocTypeSelection={actions.newDocTypeSelection}
        setNewDocTypeSelection={actions.setNewDocTypeSelection}
        newDocLoading={actions.newDocLoading}
        handleCreateDocument={actions.handleCreateDocument}
        editOpened={actions.editOpened}
        closeEdit={actions.closeEdit}
        editName={actions.editName}
        setEditName={actions.setEditName}
        editLoading={actions.editLoading}
        handleEditSubmit={actions.handleEditSubmit}
        deleteOpened={actions.deleteOpened}
        closeDelete={actions.closeDelete}
        deleteLoading={actions.deleteLoading}
        handleDeleteConfirm={actions.handleDeleteConfirm}
      />
    </Container>
  );
}
