/* eslint-disable max-lines -- document page layout shell */
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
import { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconArchiveOff,
  IconPencil,
  IconTarget,
  IconArrowsExchange,
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
import { DocumentTypeMetadataSection } from './DocumentTypeMetadataSection.js';
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
  editTypeId: string | null;
  setEditTypeId: (v: string | null) => void;
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
  openMoveContext: () => void;
  moveDecisionLoading: boolean;
  onMoveRequestDecision: (action: 'accept' | 'reject' | 'withdraw') => void;
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
  editTypeId,
  setEditTypeId,
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
  openMoveContext,
  moveDecisionLoading,
  onMoveRequestDecision,
  openDelete,
  openCreateTag,
  openManageTags,
  publishedVersionIsStale,
  ackPublishedVersion,
  latestPublishedVersion,
  onReloadPublishedContent,
}: DocumentPageLoadedLayoutProps) {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();
  const docTitle = mode === 'edit' ? editTitle || t('common:status.untitled') : data.title;
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
              {t('documentPage.toolbar.cancel')}
            </Button>
            <Button
              size="sm"
              loading={saveLoading}
              disabled={editTab === 'draft' && !leadDraftDirty}
              onClick={() =>
                void (editTab === 'draft' ? leadDraftPanelRef.current?.saveDraft() : handleSave())
              }
            >
              {editTab === 'draft'
                ? t('documentPage.toolbar.saveDraft')
                : t('documentPage.toolbar.save')}
            </Button>
            {editTab === 'draft' && leadDraftLastSynced && (
              <Text size="xs" c="dimmed">
                {t('documentPage.toolbar.lastSynced', {
                  time: new Date(leadDraftLastSynced).toLocaleTimeString(),
                })}
              </Text>
            )}
          </>
        )}
        {canEnterEditMode && mode === 'view' && (
          <ActionIcon
            variant="filled"
            size="36"
            aria-label={t('documentPage.toolbar.editDocumentAria')}
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
            {data.publishedAt
              ? t('documentPage.toolbar.publishChanges')
              : t('documentPage.toolbar.publish')}
          </Button>
        )}
        {mode === 'edit' &&
          data.canPublish &&
          !showPublishButton &&
          leadDraftPendingSuggestions > 0 && (
            <Text size="xs" c="dimmed">
              {t('documentPage.toolbar.resolvePendingSuggestions', {
                count: leadDraftPendingSuggestions,
              })}
            </Text>
          )}
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="default"
              size="36"
              aria-label={t('documentPage.toolbar.moreActionsAria')}
            >
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              to={`/documents/${documentId}/versions`}
              leftSection={<IconHistory size={14} />}
            >
              {t('documentPage.menu.history')}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={14} />}
              disabled={pdfExportLoading}
              onClick={() => void handleStartPdfExport()}
            >
              {pdfExportLoading
                ? t('documentPage.menu.exportingPdf')
                : t('documentPage.menu.exportPdf')}
            </Menu.Item>
            {pdfExportStatus?.status === 'succeeded' && pdfExportStatus.downloadUrl && (
              <Menu.Item
                component="a"
                href={pdfExportStatus.downloadUrl}
                target="_blank"
                rel="noreferrer"
                leftSection={<IconDownload size={14} />}
              >
                {t('documentPage.menu.downloadPdf')}
              </Menu.Item>
            )}
            {hasNoContext && data.canWrite && (
              <Menu.Item leftSection={<IconTarget size={14} />} onClick={openAssignContext}>
                {t('documentPage.menu.assignContext')}
              </Menu.Item>
            )}
            {!hasNoContext && (data.canMove || data.canRequestMove) && !data.pendingMoveRequest && (
              <Menu.Item leftSection={<IconArrowsExchange size={14} />} onClick={openMoveContext}>
                {t('documentPage.menu.moveContext')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canWithdraw && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={14} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('withdraw')}
              >
                {t('documentPage.menu.withdrawMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canAccept && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={14} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('accept')}
              >
                {t('documentPage.menu.acceptMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canReject && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={14} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('reject')}
              >
                {t('documentPage.menu.rejectMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest && (
              <Menu.Item component={Link} to="/approvals?tab=moves">
                {t('documentPage.menu.openInApprovals')}
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
                  {t('documentPage.menu.removeStartHere', { scope: scope.scopeName })}
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
                  {t('documentPage.menu.setStartHere', { scope: scope.scopeName })}
                </Menu.Item>
              )
            )}
            {data.canWrite && !data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                onClick={() => void handleArchive()}
              >
                {t('documentPage.menu.archive')}
              </Menu.Item>
            )}
            {data.canWrite && data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchiveOff size={14} />}
                onClick={() => void handleUnarchive()}
              >
                {t('documentPage.menu.unarchive')}
              </Menu.Item>
            )}
            {data.canDelete && <Menu.Divider />}
            {data.canDelete && (
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={openDelete}>
                {t('documentPage.menu.moveToTrash')}
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
    data.canMove,
    data.canPublish,
    data.archivedAt,
    data.canDelete,
    data.publishedAt,
    startHereScopes,
    startHereBusy,
    t,
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
        style={{ display: 'flex' }}
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
            align={{ base: 'stretch', lg: 'stretch' }}
            wrap="nowrap"
            w="100%"
            style={{ overflow: 'visible' }}
          >
            <Box className="document-page-reading">
              <Box
                className={
                  mode === 'edit'
                    ? 'document-page-scroll document-page-scroll--edit'
                    : 'document-page-scroll'
                }
              >
                {mode === 'view' ? (
                  <Stack gap="lg" align="stretch" w="100%">
                    {!data.canPublish && publishedVersionIsStale && ackPublishedVersion != null && (
                      <DocumentPublishedVersionAlert
                        show
                        currentVersion={latestPublishedVersion}
                        acknowledgedVersion={ackPublishedVersion}
                        onReload={onReloadPublishedContent}
                      />
                    )}
                    <Card className="document-page-card" w="100%" padding={0}>
                      <Box style={{ maxWidth: '100%' }}>
                        {data.publishedBlocks != null && data.publishedBlocks.blocks.length > 0 ? (
                          publishedPlainFromBlocks ? (
                            <DocumentBlocksPreview
                              doc={data.publishedBlocks}
                              documentId={documentId}
                            />
                          ) : (
                            <Text size="sm" c="dimmed">
                              {t('documentPage.noExtractableText')}
                            </Text>
                          )
                        ) : (
                          <Text size="sm" c="dimmed">
                            {t('documentPage.noPublishedContent')}
                          </Text>
                        )}
                      </Box>
                    </Card>
                  </Stack>
                ) : (
                  <Box className="document-page-edit-fill">
                    {!data.canPublish && publishedVersionIsStale && ackPublishedVersion != null && (
                      <Box mb="md" style={{ flexShrink: 0 }}>
                        <DocumentPublishedVersionAlert
                          show
                          currentVersion={latestPublishedVersion}
                          acknowledgedVersion={ackPublishedVersion}
                          onReload={onReloadPublishedContent}
                        />
                      </Box>
                    )}
                    <Card
                      className="document-page-card document-page-card--edit"
                      w="100%"
                      padding={0}
                    >
                      <Tabs
                        className="document-page-edit-tabs"
                        value={editTab}
                        onChange={(v) => setEditTab((v as typeof editTab) ?? 'draft')}
                      >
                        <Box className="document-page-edit-sticky-stack">
                          <Tabs.List>
                            <Tabs.Tab value="draft">{t('documentPage.tabs.draft')}</Tabs.Tab>
                            <Tabs.Tab value="metadata">{t('documentPage.tabs.metadata')}</Tabs.Tab>
                            {canManageAccess && (
                              <Tabs.Tab value="access">{t('documentPage.tabs.access')}</Tabs.Tab>
                            )}
                          </Tabs.List>
                          <Box
                            className="document-page-edit-sticky-chrome-host"
                            data-document-edit-sticky-chrome
                          />
                        </Box>
                        <Tabs.Panel value="draft" className="document-page-edit-fill">
                          {!hasDraftBlocks &&
                            !hasPublishedBlocks &&
                            leadDraftLastSynced != null && (
                              <Alert
                                color="yellow"
                                mb="md"
                                title={t('documentPage.emptyDraftAlertTitle')}
                                style={{ flexShrink: 0 }}
                              >
                                <Text size="sm">{t('documentPage.emptyDraftAlertBody')}</Text>
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
                        <Tabs.Panel
                          value="metadata"
                          pt="md"
                          className="document-page-edit-panel-scroll"
                        >
                          <Stack gap="md">
                            <TextInput
                              label={t('documentPage.metadataFields.title')}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.currentTarget.value)}
                              maxLength={500}
                            />
                            <TextInput
                              label={t('documentPage.metadataFields.description')}
                              placeholder={t('documentPage.metadataFields.descriptionPlaceholder')}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.currentTarget.value)}
                              maxLength={500}
                            />
                            {data.canWrite ? (
                              <DocumentTypeMetadataSection
                                contextId={data.contextId}
                                typeId={editTypeId}
                                onTypeIdChange={setEditTypeId}
                              />
                            ) : null}
                            <Group align="flex-end" gap="xs">
                              <MultiSelect
                                label={t('documentPage.metadataFields.tags')}
                                placeholder={t('documentPage.metadataFields.tagsPlaceholder')}
                                data={tagOptions}
                                value={editTagIds}
                                onChange={setEditTagIds}
                                searchable
                                clearable
                                style={{ flex: 1 }}
                              />
                              <Button variant="filled" size="sm" onClick={openCreateTag}>
                                {t('documentPage.metadataFields.createTag')}
                              </Button>
                              <Button variant="subtle" size="sm" onClick={openManageTags}>
                                {t('documentPage.metadataFields.manageTags')}
                              </Button>
                            </Group>
                          </Stack>
                        </Tabs.Panel>
                        {canManageAccess && (
                          <Tabs.Panel
                            value="access"
                            pt="md"
                            className="document-page-edit-panel-scroll"
                          >
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
                  </Box>
                )}
              </Box>
            </Box>

            <Box
              component="aside"
              aria-label={t('documentPage.commentsAside')}
              className="document-page-comments-aside"
              w={{ base: '100%', lg: 'auto' }}
              style={{ flexShrink: 0 }}
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
