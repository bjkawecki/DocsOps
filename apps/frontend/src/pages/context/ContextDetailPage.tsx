import {
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Flex,
  Container,
  Menu,
  ActionIcon,
  Box,
  Paper,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { useRecentItemsActions, type RecentScope } from '../../hooks/useRecentItems';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { ownerToScopeForBreadcrumb, scopeToLabel } from '../../lib/scopeNav';
import { scopeToKey } from '../../hooks/useRecentItems';
import { ContentLink } from '../../components/ui/ContentLink';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { ContextDocumentsTable } from '../../components/contexts/ContextDocumentsTable';
import { NewDraftDocumentModal } from '../../components/contexts/NewDraftDocumentModal';
import { ProjectSiblingSubnav } from '../../components/contexts/ProjectSiblingSubnav';
import { EditContextNameModal } from '../../components/contexts/EditContextNameModal';
import { submitNewContextDocumentDraft } from '../contextScope/submitNewContextDocumentDraft';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDotsVertical,
  IconPencil,
  IconArchive,
  IconTrash,
  IconRoute,
  IconBriefcase,
} from '@tabler/icons-react';
import { useSetAppShellBreadcrumbs } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { buildContextBreadcrumbs } from '../../components/appShell/scopeBreadcrumbs.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared';

type ContextType = 'process' | 'project';

type OwnerResponse = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  ownerUserId?: string | null;
  displayName?: string | null;
};
type ProcessResponse = {
  id: string;
  name: string;
  contextId: string;
  ownerId?: string;
  owner: OwnerResponse;
  canWriteContext?: boolean;
};
type SubcontextItem = { id: string; name: string; contextId: string };
type ProjectResponse = {
  id: string;
  name: string;
  contextId: string;
  ownerId?: string;
  owner: OwnerResponse;
  canWriteContext?: boolean;
  subcontexts?: SubcontextItem[];
};

type ContextDocument = {
  id: string;
  title: string;
  contextId: string;
  createdAt: string;
  updatedAt: string;
  documentTags: { tag: { id: string; name: string } }[];
};

function ownerToScope(owner: OwnerResponse): RecentScope | null {
  if (owner.companyId) return { type: 'company', id: owner.companyId };
  if (owner.departmentId) return { type: 'department', id: owner.departmentId };
  if (owner.teamId) return { type: 'team', id: owner.teamId };
  return null;
}

export interface ContextDetailPageProps {
  type: ContextType;
  id: string;
}

export function ContextDetailPage({ type, id }: ContextDetailPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const recentActions = useRecentItemsActions();
  const canManage = (me?.identity?.companyLeads?.length ?? 0) > 0 || me?.user?.isAdmin === true;

  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editName, setEditName] = useState('');
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

  const endpoint = type === 'process' ? '/api/v1/processes' : '/api/v1/projects';
  const queryKey = type === 'process' ? ['processes'] : ['projects'];

  const { data, isPending, isError } = useQuery({
    queryKey: [type, id],
    queryFn: async () => {
      const res = await apiFetch(`${endpoint}/${id}`);
      if (!res.ok) throw new Error('Context not found');
      return res.json() as Promise<ProcessResponse | ProjectResponse>;
    },
    enabled: !!id,
  });

  const contextId = data?.contextId;
  const { data: documentsData } = useQuery({
    queryKey: ['contexts', contextId, 'documents'],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/contexts/${contextId}/documents?limit=100&offset=0`);
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

  const contextOwnerId = data && 'ownerId' in data ? data.ownerId : undefined;

  const { data: tagsData } = useQuery({
    queryKey: ['tags', contextOwnerId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/tags?ownerId=${contextOwnerId}`);
      if (!res.ok) throw new Error('Failed to load tags');
      return res.json() as Promise<{ id: string; name: string }[]>;
    },
    enabled: !!contextOwnerId,
  });

  const documents = documentsData?.items ?? [];
  const tagOptions = (tagsData ?? []).map((t) => ({ value: t.id, label: t.name }));

  const scopeParam = data?.owner?.companyId
    ? `companyId=${data.owner.companyId}`
    : data?.owner?.departmentId
      ? `departmentId=${data.owner.departmentId}`
      : data?.owner?.teamId
        ? `teamId=${data.owner.teamId}`
        : data?.owner?.ownerUserId
          ? `ownerUserId=${data.owner.ownerUserId}`
          : '';

  const { data: siblingsData } = useQuery({
    queryKey: [type, 'siblings', scopeParam],
    queryFn: async () => {
      const res = await apiFetch(`${endpoint}?limit=100&offset=0&${scopeParam}`);
      if (!res.ok) throw new Error('Failed to load siblings');
      return res.json() as Promise<{
        items: { id: string; name: string; subcontexts?: { id: string; name: string }[] }[];
      }>;
    },
    enabled: !!scopeParam,
  });
  const siblings = siblingsData?.items ?? [];

  useEffect(() => {
    if (!data?.id || !recentActions) return;
    const scope = ownerToScope(data.owner);
    if (scope) recentActions.addRecent({ type, id: data.id, name: data.name }, scope);
  }, [data?.id, data?.name, data?.owner, type, recentActions]);

  const invalidateAndClose = () => {
    void queryClient.invalidateQueries({ queryKey });
    closeEdit();
    closeDelete();
  };

  const handleEditClick = () => {
    if (data) {
      setEditName(data.name);
      openEdit();
    }
  };

  const handleEditSuccess = () => {
    invalidateAndClose();
    if (data) setEditName(data.name);
    void queryClient.invalidateQueries({ queryKey: [type, id] });
    notifications.show({
      title: 'Saved',
      message: 'Name was updated.',
      color: 'green',
    });
  };

  const handleArchive = async () => {
    const res = await apiFetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['me', 'archive'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
      notifications.show({ title: 'Archived', message: 'Context was archived.', color: 'green' });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (res.status === 204) {
        void queryClient.invalidateQueries({ queryKey });
        void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
        closeDelete();
        void navigate('/company', { replace: true });
        notifications.show({
          title: 'Moved to trash',
          message: 'Context can be restored from the Trash tab.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!data?.contextId) return;
    await submitNewContextDocumentDraft({
      contextId: data.contextId,
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
    if (type !== 'project' || !id) return;
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
      const res = await apiFetch(`/api/v1/projects/${id}/subcontexts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.status === 201) {
        void queryClient.invalidateQueries({ queryKey: [type, id] });
        void queryClient.invalidateQueries({ queryKey: [type, 'siblings', scopeParam] });
        closeNewSubcontext();
        setNewSubcontextName('');
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

  const scope = data ? ownerToScopeForBreadcrumb(data.owner) : null;
  const scopeKey = scope == null ? null : scopeToKey(scope);
  const scopeName = data?.owner.displayName ?? (scope ? scopeToLabel(scope) : 'Overview');
  const contextName = data?.name;
  const breadcrumbItems = useMemo(
    () =>
      contextName != null
        ? buildContextBreadcrumbs({
            scope,
            scopeLabel: scopeName,
            contextType: type,
            contextName,
          })
        : null,
    // scope identity via scopeKey (ownerToScopeForBreadcrumb returns a new object each render)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scope rebuilt when scopeKey changes
    [contextName, scopeKey, scopeName, type]
  );
  useSetAppShellBreadcrumbs(breadcrumbItems);
  useSetAppShellNavScope(scope);

  if (isPending)
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  if (isError || !data)
    return (
      <Text size="sm" c="red">
        Context not found.
      </Text>
    );

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <PageHeader
        title={data.name}
        titleOrder={2}
        titleIcon={
          type === 'process' ? (
            <IconRoute size={22} stroke={1.5} color="var(--mantine-color-dimmed)" />
          ) : (
            <IconBriefcase size={22} stroke={1.5} color="var(--mantine-color-dimmed)" />
          )
        }
        actions={
          <Group gap="xs">
            {data.canWriteContext && (
              <Button variant="filled" size="sm" onClick={openNewDoc}>
                New draft
              </Button>
            )}
            {canManage && (
              <>
                <ActionIcon
                  variant="filled"
                  size="36"
                  aria-label="Edit context"
                  onClick={handleEditClick}
                >
                  <IconPencil size={18} />
                </ActionIcon>
                <Menu shadow="md" position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="default" size="36" aria-label="More actions">
                      <IconDotsVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconArchive size={14} />}
                      onClick={() => void handleArchive()}
                    >
                      Archive
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={openDelete}
                    >
                      Move to trash
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </Group>
        }
      />

      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ProjectSiblingSubnav
            variant={type === 'process' ? 'process' : 'project'}
            siblings={siblings}
          />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <ContentCardWrapper fullHeight={false}>
              <Stack gap="xl">
                <Box data-context-docs-table>
                  <SectionLabel mb="sm">Documents</SectionLabel>
                  <ContextDocumentsTable documents={documents} />
                </Box>

                {type === 'project' && (
                  <Box>
                    <Group justify="space-between" wrap="nowrap" mb="sm">
                      <SectionLabel>Subcontexts</SectionLabel>
                      {data.canWriteContext && (
                        <Button variant="filled" size="xs" onClick={openNewSubcontext}>
                          Create subcontext
                        </Button>
                      )}
                    </Group>
                    {((data as ProjectResponse).subcontexts?.length ?? 0) === 0 ? (
                      <Text size="sm" c="dimmed">
                        No subcontexts yet.
                      </Text>
                    ) : (
                      <Stack gap={4}>
                        {((data as ProjectResponse).subcontexts ?? []).map((sub) => (
                          <ContentLink
                            key={sub.id}
                            to={`/projects/${id}/subcontexts/${sub.id}`}
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
            </ContentCardWrapper>
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

      <EditContextNameModal
        opened={editOpened}
        onClose={closeEdit}
        type={type}
        contextId={id}
        currentName={editName}
        onSuccess={handleEditSuccess}
      />

      <Modal opened={deleteOpened} onClose={closeDelete} title="Move to trash" centered>
        <Text size="sm" c="dimmed" mb="md">
          This context and its documents will be moved to trash. You can restore them from the Trash
          tab.
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
            Move to trash
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
