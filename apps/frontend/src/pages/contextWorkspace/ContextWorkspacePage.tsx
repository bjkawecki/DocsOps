import {
  ActionIcon,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconArchive, IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { useRecentItemsActions, type RecentScope } from '../../hooks/useRecentItems';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import {
  deriveOwnerScopeCanManage,
  ownerToScopeForBreadcrumb,
  scopeToLabel,
  scopeToUrl,
} from '../../lib/scopeNav';
import { scopeToKey } from '../../hooks/useRecentItems';
import { ContentLink } from '../../components/ui/ContentLink';
import { SectionLabel } from '../../components/ui/SectionLabel';
import {
  ContextDocumentsTable,
  readDocsListLimit,
  readDocsListPage,
} from '../../components/contexts/ContextDocumentsTable';
import { NewDraftDocumentModal } from '../../components/contexts/NewDraftDocumentModal';
import { submitNewContextDocumentDraft } from '../contextScope/submitNewContextDocumentDraft';
import { useSetAppShellBreadcrumbs } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import {
  buildContextBreadcrumbs,
  scopeBreadcrumbItem,
} from '../../components/appShell/scopeBreadcrumbs.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import {
  contextUrl,
  scopeArchiveUrl,
  scopeTrashUrl,
  writeLastScopeContextId,
} from './contextPaths.js';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

type ContextType = 'process' | 'project' | 'subcontext';

type OwnerResponse = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  ownerUserId?: string | null;
  displayName?: string | null;
};

type SubcontextSummary = { id: string; name: string; contextId: string };
type ParentProjectSummary = { id: string; name: string; contextId: string };

type ContextResponse = {
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

type ContextDocument = {
  id: string;
  title: string;
  updatedAt: string;
  documentTags: { tag: { id: string; name: string } }[];
};

/** Base API path for the entity behind a Context (process/project/subcontext mutations). */
function entityEndpointBase(contextType: ContextType): string {
  if (contextType === 'process') return '/api/v1/processes';
  if (contextType === 'project') return '/api/v1/projects';
  return '/api/v1/subcontexts';
}

export function ContextWorkspacePage() {
  const { contextId } = useParams<{ contextId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: me } = useMe();
  const recentActions = useRecentItemsActions();

  const docsPage = readDocsListPage(searchParams);
  const docsLimit = readDocsListLimit(searchParams);
  const docsOffset = (docsPage - 1) * docsLimit;

  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newDocOpened, { open: openNewDoc, close: closeNewDoc }] = useDisclosure(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocTagIds, setNewDocTagIds] = useState<string[]>([]);
  const [newDocLoading, setNewDocLoading] = useState(false);
  const [newSubcontextOpened, { open: openNewSubcontext, close: closeNewSubcontext }] =
    useDisclosure(false);
  const [newSubcontextName, setNewSubcontextName] = useState('');
  const [newSubcontextLoading, setNewSubcontextLoading] = useState(false);
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
  const tagOptions = (tagsData ?? []).map((t) => ({ value: t.id, label: t.name }));

  const scope: RecentScope | null = useMemo(
    () => (data ? ownerToScopeForBreadcrumb(data.owner) : null),
    // Owner ids are the identity; avoid new object each render (breaks chrome memo/effects).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by owner FK fields
    [data?.owner.companyId, data?.owner.departmentId, data?.owner.teamId, data?.owner.ownerUserId]
  );
  const scopeName = data?.owner.displayName ?? (scope ? scopeToLabel(scope) : 'Overview');
  const {
    processes: sidebarProcesses,
    projects: sidebarProjects,
    drafts: sidebarDrafts,
    scopeKey,
  } = useScopeSidebarNav(scope);

  useEffect(() => {
    if (!data || data.id !== contextId || !recentActions) return;
    if (data.contextType !== 'process' && data.contextType !== 'project') return;
    const itemScope = ownerToScopeForBreadcrumb(data.owner);
    if (itemScope) {
      recentActions.addRecent({ type: data.contextType, id: data.id, name: data.name }, itemScope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- owner identity via FK fields below
  }, [
    contextId,
    data?.id,
    data?.name,
    data?.contextType,
    data?.owner.companyId,
    data?.owner.departmentId,
    data?.owner.teamId,
    data?.owner.ownerUserId,
    recentActions,
  ]);

  useEffect(() => {
    if (!data || data.id !== contextId) return;
    const itemScope = ownerToScopeForBreadcrumb(data.owner);
    if (itemScope) writeLastScopeContextId(scopeToKey(itemScope), data.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- owner identity via FK fields below
  }, [
    contextId,
    data?.id,
    data?.owner.companyId,
    data?.owner.departmentId,
    data?.owner.teamId,
    data?.owner.ownerUserId,
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scope identity via scopeKey
  }, [showContextDetail, data, scope, scopeKey, scopeName]);
  useSetAppShellBreadcrumbs(breadcrumbItems);
  useSetAppShellNavScope(scope);

  const scopeCanManage = deriveOwnerScopeCanManage(me, data?.owner);
  const showTrashArchive = canShowTrashArchiveTabs(me, scopeCanManage);
  const trashArchive =
    showTrashArchive && scope != null
      ? { trashTo: scopeTrashUrl(scope), archiveTo: scopeArchiveUrl(scope) }
      : null;

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['context', contextId] });
    void queryClient.invalidateQueries({ queryKey: ['processes', 'siblings', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'siblings', scopeKey] });
  };

  const handleEditClick = () => {
    if (data) {
      setEditName(data.name);
      openEdit();
    }
  };

  const handleEditSubmit = async () => {
    if (!data || !editName.trim()) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`${entityEndpointBase(data.contextType)}/${data.entityId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        invalidateAll();
        closeEdit();
        notifications.show({ title: 'Saved', message: 'Name was updated.', color: 'green' });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!data || data.contextType === 'subcontext') return;
    const res = await apiFetch(`${entityEndpointBase(data.contextType)}/${data.entityId}`, {
      method: 'PATCH',
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      invalidateAll();
      void queryClient.invalidateQueries({ queryKey: ['me', 'archive'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
      notifications.show({ title: 'Archived', message: 'Context was archived.', color: 'green' });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!data) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${entityEndpointBase(data.contextType)}/${data.entityId}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        invalidateAll();
        void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
        closeDelete();
        const target =
          data.contextType === 'subcontext' && data.parentProject
            ? contextUrl(data.parentProject.contextId)
            : scope
              ? scopeToUrl(scope)
              : '/';
        void navigate(target, { replace: true });
        notifications.show({
          title: data.contextType === 'subcontext' ? 'Deleted' : 'Moved to trash',
          message:
            data.contextType === 'subcontext'
              ? 'The subcontext was permanently deleted.'
              : 'You can restore it from the Trash tab.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const breadcrumbActions = useMemo(() => {
    if (!showContextDetail || !data?.canWriteContext) return null;
    return (
      <Group gap="xs">
        <Button variant="filled" size="sm" onClick={openNewDoc}>
          New draft
        </Button>
        <ActionIcon variant="filled" size="36" aria-label="Edit context" onClick={handleEditClick}>
          <IconPencil size={18} />
        </ActionIcon>
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="default" size="36" aria-label="More actions">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {data.contextType !== 'subcontext' && (
              <>
                <Menu.Item
                  leftSection={<IconArchive size={14} />}
                  onClick={() => void handleArchive()}
                >
                  Archive
                </Menu.Item>
                <Menu.Divider />
              </>
            )}
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={openDelete}>
              {data.contextType === 'subcontext' ? 'Delete' : 'Move to trash'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    );
    // Handlers close over current data; re-sync when write/type/id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey drives shell update
  }, [
    showContextDetail,
    data?.canWriteContext,
    data?.contextType,
    contextId,
    openNewDoc,
    openDelete,
  ]);

  useSetAppShellBreadcrumbActions(
    breadcrumbActions,
    showContextDetail && data?.canWriteContext
      ? `ctx-actions:${contextId}:${data.contextType}`
      : 'none'
  );

  const handleCreateDocument = async () => {
    if (!contextId) return;
    await submitNewContextDocumentDraft({
      contextId,
      title: newDocTitle,
      tagIds: newDocTagIds,
      queryClient,
      navigate,
      setLoading: setNewDocLoading,
      onSuccessCleanup: () => {
        closeNewDoc();
        setNewDocTitle('');
        setNewDocTagIds([]);
      },
    });
  };

  const handleCreateSubcontext = async () => {
    if (!data || data.contextType !== 'project') return;
    const name = newSubcontextName.trim();
    if (!name) {
      notifications.show({
        title: 'Name required',
        message: 'Please enter a name for the subcontext.',
        color: 'yellow',
      });
      return;
    }
    setNewSubcontextLoading(true);
    try {
      const res = await apiFetch(`/api/v1/projects/${data.entityId}/subcontexts`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { contextId: string };
        invalidateAll();
        closeNewSubcontext();
        setNewSubcontextName('');
        void navigate(contextUrl(created.contextId));
        notifications.show({
          title: 'Subcontext created',
          message: 'The subcontext was added.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setNewSubcontextLoading(false);
    }
  };

  if (!contextId) return null;

  // First load only – keep the shell mounted while switching contexts (placeholderData).
  if (!data && isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }
  if (!data || (isError && !contextReady)) {
    return (
      <Text size="sm" c="red">
        Context not found.
      </Text>
    );
  }

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ScopeContextSidebar
            processes={sidebarProcesses}
            projects={sidebarProjects}
            drafts={sidebarDrafts}
            activeContextId={contextSelected ? contextId : null}
            onContextNavClick={handleContextNavClick}
            trashArchive={trashArchive}
          />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {!contextReady ? (
              <Text size="sm" c="dimmed">
                Loading…
              </Text>
            ) : !contextSelected ? (
              <Text size="sm" c="dimmed">
                Select a process or project to view documents.
              </Text>
            ) : (
              <Stack gap="xl">
                <Box data-context-docs-table>
                  <ContextDocumentsTable documents={documents} total={documentsTotal} />
                </Box>

                {data.contextType === 'project' && (
                  <Box>
                    <Group justify="space-between" wrap="nowrap" mb="sm">
                      <SectionLabel>Subcontexts</SectionLabel>
                      {data.canWriteContext && (
                        <Button variant="filled" size="xs" onClick={openNewSubcontext}>
                          Create subcontext
                        </Button>
                      )}
                    </Group>
                    {(data.subcontexts?.length ?? 0) === 0 ? (
                      <Text size="sm" c="dimmed">
                        No subcontexts yet.
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
        </Flex>
      </Paper>

      <Modal
        opened={newSubcontextOpened}
        onClose={closeNewSubcontext}
        title="Create subcontext"
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            value={newSubcontextName}
            onChange={(e) => setNewSubcontextName(e.currentTarget.value)}
            placeholder="e.g. meeting notes, milestones"
            required
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeNewSubcontext}>
              Cancel
            </Button>
            <Button loading={newSubcontextLoading} onClick={() => void handleCreateSubcontext()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      <NewDraftDocumentModal
        opened={newDocOpened}
        onClose={closeNewDoc}
        title={newDocTitle}
        onTitleChange={setNewDocTitle}
        tagOptions={tagOptions}
        tagIds={newDocTagIds}
        onTagIdsChange={setNewDocTagIds}
        loading={newDocLoading}
        onSubmit={handleCreateDocument}
      />

      <Modal opened={editOpened} onClose={closeEdit} title="Edit name" size="sm">
        <Stack gap="md">
          <TextInput
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.currentTarget.value)}
            placeholder="Context name"
            required
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeEdit}>
              Cancel
            </Button>
            <Button loading={editLoading} onClick={() => void handleEditSubmit()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={data.contextType === 'subcontext' ? 'Delete subcontext' : 'Move to trash'}
        centered
      >
        <Text size="sm" c="dimmed" mb="md">
          {data.contextType === 'subcontext'
            ? 'This subcontext and its documents will be permanently deleted. Continue?'
            : 'This context and its documents will be moved to trash. You can restore them from the Trash tab.'}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={() => {
              void handleDeleteConfirm();
            }}
          >
            {data.contextType === 'subcontext' ? 'Delete' : 'Move to trash'}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
