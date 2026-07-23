import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Menu,
  Stack,
  Tabs,
  Text,
  TextInput,
  MultiSelect,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import type { RefObject } from 'react';
import { useMemo } from 'react';
import {
  IconArchive,
  IconArchiveOff,
  IconPencil,
  IconTarget,
  IconTrash,
  IconCloudUpload,
  IconHistory,
  IconDotsVertical,
  IconDownload,
  IconFlag,
  IconFlagOff,
} from '@tabler/icons-react';
import {
  DocumentBlocksPreview,
  blockDocumentToPlainPreview,
} from '../../components/documents/DocumentBlocksPreview';
import { DocumentPublishedVersionAlert } from '../../components/documents/documentLeadDraft/DocumentPublishedVersionAlert.js';
import { DocumentLeadDraftPanel } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import { DocumentAccessPanel } from '../../components/documents/DocumentAccessPanel';
import { DocumentCommentsSection } from '../../components/documents/DocumentCommentsSection';
import { DocumentDocBreadcrumbs } from '../../components/documents/DocumentDocBreadcrumbs';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import {
  useClearScopeStartDocument,
  useSetScopeStartDocument,
} from '../../hooks/useScopeStartDocument.js';
import { ContextSwitcherSelect } from '../contextWorkspace/ContextSwitcherSelect.js';
import { contextUrl } from '../contextWorkspace/contextPaths.js';
import {
  CONTEXT_WORKSPACE_LEFT_WIDTH,
  ContextWorkspaceLeftColumn,
} from '../contextWorkspace/contextWorkspaceChrome.js';
import type {
  DocumentResponse,
  DocumentScope,
  PdfExportJobStatusResponse,
} from './documentPageTypes';
import { DocumentSidebarMeta } from './buildDocumentMetadataItems';
import { DocumentContextDocsNav } from './DocumentContextDocsNav.js';
import { DocumentTocNav } from './DocumentTocNav.js';

function documentScopeToRecentScope(scope: DocumentScope | null): RecentScope | null {
  if (scope == null) return null;
  if (scope.type === 'personal') return { type: 'personal' };
  if (scope.type === 'company' || scope.type === 'department' || scope.type === 'team') {
    return { type: scope.type, id: scope.id };
  }
  return null;
}

export type DocumentPageLoadedLayoutProps = {
  documentId: string;
  data: DocumentResponse;
  mode: 'view' | 'edit';
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editTagIds: string[];
  setEditTagIds: (v: string[]) => void;
  saveLoading: boolean;
  publishLoading: boolean;
  editTab: 'draft' | 'metadata' | 'access';
  setEditTab: (v: 'draft' | 'metadata' | 'access') => void;
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftLastSynced: string | null;
  leadDraftDirty: boolean;
  hasDraftBlocks: boolean;
  hasPublishedBlocks: boolean;
  showPublishButton: boolean;
  me: { user?: { id?: string; name?: string; isAdmin?: boolean } } | undefined;
  isTabVisible: boolean;
  tagOptions: { value: string; label: string }[];
  headings: { level: number; text: string; id: string }[];
  numberedHeadings: { level: number; text: string; id: string; numbering: string }[];
  setLeadDraftDirty: (dirty: boolean) => void;
  setLeadDraftLastSynced: (iso: string | null) => void;
  setLeadDraftPendingSuggestions: (count: number) => void;
  leadDraftPendingSuggestions: number;
  pdfExportLoading: boolean;
  pdfExportStatus: PdfExportJobStatusResponse | undefined;
  handleCancelEdit: () => void;
  handleSave: () => Promise<void>;
  handleEditClick: () => void;
  handlePublish: () => Promise<void>;
  handleStartPdfExport: () => Promise<void>;
  handleArchive: () => Promise<void>;
  handleUnarchive: () => Promise<void>;
  openAssignContext: () => void;
  openDelete: () => void;
  openCreateTag: () => void;
  openManageTags: () => void;
  publishedVersionIsStale: boolean;
  ackPublishedVersion: number | null;
  latestPublishedVersion: number;
  onReloadPublishedContent: () => void;
};

export function DocumentPageLoadedLayout({
  documentId,
  data,
  mode,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editTagIds,
  setEditTagIds,
  saveLoading,
  publishLoading,
  editTab,
  setEditTab,
  leadDraftPanelRef,
  leadDraftLastSynced,
  leadDraftDirty,
  hasDraftBlocks,
  hasPublishedBlocks,
  showPublishButton,
  me,
  isTabVisible,
  tagOptions,
  headings,
  numberedHeadings,
  setLeadDraftDirty,
  setLeadDraftLastSynced,
  setLeadDraftPendingSuggestions,
  leadDraftPendingSuggestions,
  pdfExportLoading,
  pdfExportStatus,
  handleCancelEdit,
  handleSave,
  handleEditClick,
  handlePublish,
  handleStartPdfExport,
  handleArchive,
  handleUnarchive,
  openAssignContext,
  openDelete,
  openCreateTag,
  openManageTags,
  publishedVersionIsStale,
  ackPublishedVersion,
  latestPublishedVersion,
  onReloadPublishedContent,
}: DocumentPageLoadedLayoutProps) {
  const navigate = useNavigate();
  const docTitle = mode === 'edit' ? editTitle || 'Untitled' : data.title;
  const hasNoContext = data.contextId == null;
  const canEnterEditMode = data.canWrite || !!data.canPublish;
  const canManageAccess = !!data.canPublish;
  const startHereScopes = data.startHereScopes ?? [];
  const setStartHere = useSetScopeStartDocument(documentId);
  const clearStartHere = useClearScopeStartDocument(documentId);
  const startHereBusy = setStartHere.isPending || clearStartHere.isPending;
  const publishedPlainFromBlocks =
    data.publishedBlocks != null ? blockDocumentToPlainPreview(data.publishedBlocks).trim() : '';
  const ownerScope = useMemo(
    () => documentScopeToRecentScope(data.scope),
    // Scope identity is type + id; ignore optional display name churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by scope fields
    [data.scope?.type, data.scope && 'id' in data.scope ? data.scope.id : undefined]
  );
  const breadcrumbDoc = useMemo(() => ({ ...data, title: docTitle }), [data, docTitle]);

  const breadcrumbActions = useMemo(() => {
    return (
      <Group gap="xs">
        {mode === 'edit' && (
          <>
            <Button variant="default" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saveLoading}
              disabled={editTab === 'draft' && !leadDraftDirty}
              onClick={() =>
                void (editTab === 'draft' ? leadDraftPanelRef.current?.saveDraft() : handleSave())
              }
            >
              {editTab === 'draft' ? 'Save draft' : 'Save'}
            </Button>
            {editTab === 'draft' && leadDraftLastSynced && (
              <Text size="xs" c="dimmed">
                Last synced {new Date(leadDraftLastSynced).toLocaleTimeString()}
              </Text>
            )}
          </>
        )}
        {canEnterEditMode && mode === 'view' && (
          <ActionIcon
            variant="filled"
            size="36"
            aria-label="Edit document"
            onClick={handleEditClick}
          >
            <IconPencil size={18} />
          </ActionIcon>
        )}
        {mode === 'edit' && showPublishButton && (
          <Button
            variant="filled"
            size="sm"
            color="green"
            leftSection={<IconCloudUpload size={14} />}
            loading={publishLoading}
            onClick={() => void handlePublish()}
          >
            {data.publishedAt ? 'Publish changes' : 'Publish'}
          </Button>
        )}
        {mode === 'edit' &&
          data.canPublish &&
          !showPublishButton &&
          leadDraftPendingSuggestions > 0 && (
            <Text size="xs" c="dimmed">
              Resolve {leadDraftPendingSuggestions} pending suggestion(s) before publishing.
            </Text>
          )}
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="default" size="36" aria-label="More actions">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              to={`/documents/${documentId}/versions`}
              leftSection={<IconHistory size={14} />}
            >
              History
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={14} />}
              disabled={pdfExportLoading}
              onClick={() => void handleStartPdfExport()}
            >
              {pdfExportLoading ? 'Queuing PDF export...' : 'Export PDF (async)'}
            </Menu.Item>
            {pdfExportStatus?.status === 'succeeded' && pdfExportStatus.downloadUrl && (
              <Menu.Item
                component="a"
                href={pdfExportStatus.downloadUrl}
                target="_blank"
                rel="noreferrer"
                leftSection={<IconDownload size={14} />}
              >
                Download exported PDF
              </Menu.Item>
            )}
            {hasNoContext && data.canWrite && (
              <Menu.Item leftSection={<IconTarget size={14} />} onClick={openAssignContext}>
                Assign to context
              </Menu.Item>
            )}
            {startHereScopes.length > 0 && <Menu.Divider />}
            {startHereScopes.map((scope) =>
              scope.isCurrent ? (
                <Menu.Item
                  key={`${scope.scopeType}:${scope.scopeId}`}
                  leftSection={<IconFlagOff size={14} />}
                  disabled={startHereBusy}
                  onClick={() =>
                    void clearStartHere.mutateAsync({
                      scopeType: scope.scopeType,
                      scopeId: scope.scopeId,
                    })
                  }
                >
                  Remove Start here for {scope.scopeName}
                </Menu.Item>
              ) : (
                <Menu.Item
                  key={`${scope.scopeType}:${scope.scopeId}`}
                  leftSection={<IconFlag size={14} />}
                  disabled={startHereBusy}
                  onClick={() =>
                    void setStartHere.mutateAsync({
                      scopeType: scope.scopeType,
                      scopeId: scope.scopeId,
                    })
                  }
                >
                  Set as Start here for {scope.scopeName}
                </Menu.Item>
              )
            )}
            {data.canWrite && !data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                onClick={() => void handleArchive()}
              >
                Archive
              </Menu.Item>
            )}
            {data.canWrite && data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchiveOff size={14} />}
                onClick={() => void handleUnarchive()}
              >
                Unarchive
              </Menu.Item>
            )}
            {data.canDelete && <Menu.Divider />}
            {data.canDelete && (
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={openDelete}>
                Move to trash
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey drives shell update
  }, [
    mode,
    saveLoading,
    editTab,
    leadDraftDirty,
    leadDraftLastSynced,
    canEnterEditMode,
    showPublishButton,
    publishLoading,
    leadDraftPendingSuggestions,
    documentId,
    pdfExportLoading,
    pdfExportStatus?.status,
    pdfExportStatus?.downloadUrl,
    hasNoContext,
    data.canWrite,
    data.canPublish,
    data.archivedAt,
    data.canDelete,
    data.publishedAt,
    startHereScopes,
    startHereBusy,
  ]);

  useSetAppShellBreadcrumbActions(
    breadcrumbActions,
    `doc-actions:${documentId}:${mode}:${editTab}:${leadDraftDirty}:${showPublishButton}:${pdfExportLoading}:${startHereBusy}:${startHereScopes
      .map((s) => `${s.scopeType}:${s.scopeId}:${s.isCurrent ? 1 : 0}`)
      .join(',')}`
  );

  return (
    <>
      <DocumentDocBreadcrumbs documentId={documentId} doc={breadcrumbDoc} />

      {/* Same inset as ContextWorkspacePage (`Container fluid maw={1600} px="md"`). */}
      <Container
        fluid
        maw={1600}
        px="md"
        className="document-page-body"
        style={{ flex: '1 1 0%', minHeight: 0, display: 'flex' }}
      >
        <Box className="document-page-left" w={{ base: '100%', lg: CONTEXT_WORKSPACE_LEFT_WIDTH }}>
          <Box className="document-page-left-inner">
            <ContextWorkspaceLeftColumn>
              <Stack gap="md" w="100%">
                {data.contextId != null && ownerScope != null && (
                  <ContextSwitcherSelect
                    owner={ownerScope}
                    value={data.contextId}
                    onChange={(nextId) => {
                      void navigate(contextUrl(nextId));
                    }}
                  />
                )}
                {numberedHeadings.length > 0 && (
                  <DocumentTocNav numberedHeadings={numberedHeadings} />
                )}
                <DocumentSidebarMeta data={data} />
                {data.contextId != null && (
                  <DocumentContextDocsNav
                    contextId={data.contextId}
                    currentDocumentId={documentId}
                    contextType={data.contextType}
                  />
                )}
              </Stack>
            </ContextWorkspaceLeftColumn>
          </Box>
        </Box>

        <Box className="document-page-main">
          <Flex
            gap={{ base: 'lg', lg: 'xl' }}
            direction={{ base: 'column', lg: 'row' }}
            align="stretch"
            wrap="nowrap"
            w="100%"
            h="100%"
            style={{ minHeight: 0, overflow: 'hidden', flex: '1 1 0%' }}
          >
            <Box className="document-page-reading">
              <Box className="document-page-scroll">
                <Stack gap="lg" align="stretch" w="100%">
                  {!data.canPublish && publishedVersionIsStale && ackPublishedVersion != null && (
                    <DocumentPublishedVersionAlert
                      show
                      currentVersion={latestPublishedVersion}
                      acknowledgedVersion={ackPublishedVersion}
                      onReload={onReloadPublishedContent}
                    />
                  )}
                  {mode === 'view' ? (
                    <Card
                      withBorder
                      className="document-page-card"
                      w="100%"
                      padding={0}
                      styles={{
                        root: {
                          padding: '2rem 3rem',
                          background: 'var(--mantine-color-body)',
                        },
                      }}
                    >
                      <Box style={{ maxWidth: '100%' }}>
                        {data.publishedBlocks != null && data.publishedBlocks.blocks.length > 0 ? (
                          publishedPlainFromBlocks ? (
                            <DocumentBlocksPreview doc={data.publishedBlocks} />
                          ) : (
                            <Text size="sm" c="dimmed">
                              Published blocks do not contain extractable text for this preview.
                            </Text>
                          )
                        ) : (
                          <Text size="sm" c="dimmed">
                            No published block content is available for this view. Open edit mode to
                            work on the draft, or publish once the document has blocks.
                          </Text>
                        )}
                      </Box>
                    </Card>
                  ) : (
                    <Card
                      withBorder
                      className="document-page-card"
                      w="100%"
                      padding={0}
                      styles={{
                        root: {
                          padding: '2rem 3rem',
                          background: 'var(--mantine-color-body)',
                        },
                      }}
                    >
                      <Tabs
                        value={editTab}
                        onChange={(v) => setEditTab((v as typeof editTab) ?? 'draft')}
                      >
                        <Tabs.List>
                          <Tabs.Tab value="draft">Draft</Tabs.Tab>
                          <Tabs.Tab value="metadata">Metadata</Tabs.Tab>
                          {canManageAccess && <Tabs.Tab value="access">Access</Tabs.Tab>}
                        </Tabs.List>
                        <Tabs.Panel value="draft" pt="md">
                          {!hasDraftBlocks &&
                            !hasPublishedBlocks &&
                            leadDraftLastSynced != null && (
                              <Alert color="yellow" mb="md" title="Draft content is empty">
                                <Text size="sm">
                                  No block content is currently available for this document. Save
                                  the draft once to initialize it.
                                </Text>
                              </Alert>
                            )}
                          <DocumentLeadDraftPanel
                            ref={leadDraftPanelRef}
                            documentId={documentId}
                            refetchWhenVisible={isTabVisible}
                            canPublish={!!data.canPublish}
                            publishedVersionIsStale={publishedVersionIsStale}
                            currentPublishedVersionNumber={latestPublishedVersion}
                            ackPublishedVersion={ackPublishedVersion}
                            onReloadPublishedContent={onReloadPublishedContent}
                            currentUserId={me?.user?.id}
                            currentUserName={me?.user?.name}
                            isAdmin={me?.user?.isAdmin === true}
                            fallbackBlocks={data.publishedBlocks ?? null}
                            onDirtyChange={setLeadDraftDirty}
                            onLastSyncedChange={setLeadDraftLastSynced}
                            onPendingSuggestionCountChange={setLeadDraftPendingSuggestions}
                          />
                        </Tabs.Panel>
                        <Tabs.Panel value="metadata" pt="md">
                          <Stack gap="md">
                            <TextInput
                              label="Title"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.currentTarget.value)}
                              maxLength={500}
                            />
                            <TextInput
                              label="Description"
                              placeholder="Short description (optional)"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.currentTarget.value)}
                              maxLength={500}
                            />
                            <Group align="flex-end" gap="xs">
                              <MultiSelect
                                label="Tags"
                                placeholder="Select or add tags"
                                data={tagOptions}
                                value={editTagIds}
                                onChange={setEditTagIds}
                                searchable
                                clearable
                                style={{ flex: 1 }}
                              />
                              <Button variant="filled" size="sm" onClick={openCreateTag}>
                                Create tag
                              </Button>
                              <Button variant="subtle" size="sm" onClick={openManageTags}>
                                Manage tags
                              </Button>
                            </Group>
                          </Stack>
                        </Tabs.Panel>
                        {canManageAccess && (
                          <Tabs.Panel value="access" pt="md">
                            <DocumentAccessPanel
                              documentId={documentId}
                              canEditAccess={canManageAccess}
                              documentScope={
                                data.scope?.type === 'team' ||
                                data.scope?.type === 'department' ||
                                data.scope?.type === 'company'
                                  ? { type: data.scope.type, id: data.scope.id }
                                  : data.scope?.type === 'personal'
                                    ? { type: 'personal' }
                                    : null
                              }
                            />
                          </Tabs.Panel>
                        )}
                      </Tabs>
                    </Card>
                  )}
                </Stack>
              </Box>
            </Box>

            <Box
              component="aside"
              aria-label="Comments"
              w={{ base: '100%', lg: 'auto' }}
              style={{ flexShrink: 0, alignSelf: 'stretch' }}
            >
              <DocumentCommentsSection
                documentId={documentId}
                currentUserId={me?.user?.id}
                headings={headings.map(({ id, text }) => ({ id, text }))}
                layout="rail"
              />
            </Box>
          </Flex>
        </Box>
      </Container>
    </>
  );
}
