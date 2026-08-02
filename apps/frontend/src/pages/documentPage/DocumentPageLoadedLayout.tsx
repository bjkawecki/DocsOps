import { Box, Card, Container, Flex, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { RefObject } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentBlocksPreview,
  blockDocumentToPlainPreview,
} from '../../components/documents/DocumentBlocksPreview';
import { DocumentPublishedVersionAlert } from '../../components/documents/documentLeadDraft/DocumentPublishedVersionAlert.js';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
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
import type { DocumentResponse, PdfExportJobStatusResponse } from './documentPageTypes';
import { DocumentSidebarMeta } from './buildDocumentMetadataItems';
import { DocumentContextDocsNav } from './DocumentContextDocsNav.js';
import { DocumentTocNav } from './DocumentTocNav.js';
import { DocumentPageToolbarActions } from './DocumentPageToolbarActions.js';
import { DocumentPageEditPanels } from './DocumentPageEditPanels.js';

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
  const scopeType = data.scope?.type;
  const scopeId = data.scope && 'id' in data.scope ? data.scope.id : undefined;
  const ownerScope = useMemo((): RecentScope | null => {
    if (scopeType == null) return null;
    if (scopeType === 'personal') return { type: 'personal' };
    if (
      (scopeType === 'company' || scopeType === 'department' || scopeType === 'team') &&
      typeof scopeId === 'string'
    ) {
      return { type: scopeType, id: scopeId };
    }
    return null;
  }, [scopeType, scopeId]);
  const breadcrumbDoc = useMemo(() => ({ ...data, title: docTitle }), [data, docTitle]);

  const breadcrumbActions = (
    <DocumentPageToolbarActions
      documentId={documentId}
      data={data}
      mode={mode}
      editTab={editTab}
      leadDraftPanelRef={leadDraftPanelRef}
      leadDraftLastSynced={leadDraftLastSynced}
      leadDraftDirty={leadDraftDirty}
      leadDraftPendingSuggestions={leadDraftPendingSuggestions}
      saveLoading={saveLoading}
      publishLoading={publishLoading}
      canEnterEditMode={canEnterEditMode}
      showPublishButton={showPublishButton}
      hasNoContext={hasNoContext}
      pdfExportLoading={pdfExportLoading}
      pdfExportStatus={pdfExportStatus}
      moveDecisionLoading={moveDecisionLoading}
      startHereScopes={startHereScopes}
      startHereBusy={startHereBusy}
      handleCancelEdit={handleCancelEdit}
      handleSave={handleSave}
      handleEditClick={handleEditClick}
      handlePublish={handlePublish}
      handleStartPdfExport={handleStartPdfExport}
      handleArchive={handleArchive}
      handleUnarchive={handleUnarchive}
      openAssignContext={openAssignContext}
      openMoveContext={openMoveContext}
      onMoveRequestDecision={onMoveRequestDecision}
      openDelete={openDelete}
      onSetStartHere={(scope) => void setStartHere.mutateAsync(scope)}
      onClearStartHere={(scope) => void clearStartHere.mutateAsync(scope)}
    />
  );

  useSetAppShellBreadcrumbActions(
    breadcrumbActions,
    [
      'doc-actions',
      documentId,
      mode,
      editTab,
      leadDraftDirty,
      leadDraftLastSynced,
      leadDraftPendingSuggestions,
      saveLoading,
      publishLoading,
      canEnterEditMode,
      showPublishButton,
      hasNoContext,
      pdfExportLoading,
      pdfExportStatus?.status,
      pdfExportStatus?.downloadUrl,
      data.canWrite,
      data.canMove,
      data.canPublish,
      data.archivedAt,
      data.canDelete,
      data.publishedAt,
      moveDecisionLoading,
      startHereBusy,
      startHereScopes.map((s) => `${s.scopeType}:${s.scopeId}:${s.isCurrent ? 1 : 0}`).join(','),
    ].join(':')
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
                      <DocumentPageEditPanels
                        documentId={documentId}
                        data={data}
                        editTab={editTab}
                        setEditTab={setEditTab}
                        canManageAccess={canManageAccess}
                        hasDraftBlocks={hasDraftBlocks}
                        hasPublishedBlocks={hasPublishedBlocks}
                        leadDraftPanelRef={leadDraftPanelRef}
                        leadDraftLastSynced={leadDraftLastSynced}
                        isTabVisible={isTabVisible}
                        publishedVersionIsStale={publishedVersionIsStale}
                        latestPublishedVersion={latestPublishedVersion}
                        ackPublishedVersion={ackPublishedVersion}
                        onReloadPublishedContent={onReloadPublishedContent}
                        me={me}
                        setLeadDraftDirty={setLeadDraftDirty}
                        setLeadDraftLastSynced={setLeadDraftLastSynced}
                        setLeadDraftPendingSuggestions={setLeadDraftPendingSuggestions}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        editDescription={editDescription}
                        setEditDescription={setEditDescription}
                        editTypeId={editTypeId}
                        setEditTypeId={setEditTypeId}
                        tagOptions={tagOptions}
                        editTagIds={editTagIds}
                        setEditTagIds={setEditTagIds}
                        openCreateTag={openCreateTag}
                        openManageTags={openManageTags}
                      />
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
