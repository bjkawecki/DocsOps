import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { useRecentItemsActions } from '../../hooks/useRecentItems';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import { collaborationHintQueryKey } from '../../components/documents/documentLeadDraft/leadDraftQuery.js';
import type { DocumentCollaborationHint } from '../../hooks/useLiveEvents.js';
import { getBlockDocumentHeadingData } from './blockDocumentHeadings';
import { withHeadingNumbering } from './documentMarkdown';
import { DOCUMENT_TITLE_ANCHOR_ID } from '../../components/documents/DocumentReadingTitle.js';
import { useDocumentPageKeyboardEffects } from './useDocumentPageKeyboardEffects';
import { useDocumentPageSecondaryQueries } from './useDocumentPageSecondaryQueries';
import { useDocumentPageEditActions } from './useDocumentPageEditActions';
import { useDocumentPageContextActions } from './useDocumentPageContextActions';
import { useDocumentPageLifecycleActions } from './useDocumentPageLifecycleActions';
import { fetchDocument } from './fetchDocument';
import {
  showPdfExportQueuedNotification,
  updatePdfExportStatusNotification,
} from './pdfExportNotification';

export function useDocumentPage() {
  const { t } = useTranslation(['documents', 'common']);
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const recentActions = useRecentItemsActions();
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  /** Picker type id (`builtin:…` or custom cuid); null = no type. */
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [createTagOpened, { open: openCreateTag, close: closeCreateTag }] = useDisclosure(false);
  const [manageTagsOpened, { open: openManageTags, close: closeManageTags }] = useDisclosure(false);
  const [newTagName, setNewTagName] = useState('');
  const [createTagLoading, setCreateTagLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [editInitialSnapshot, setEditInitialSnapshot] = useState<{
    title: string;
    description: string;
    tagIds: string[];
    typeId: string | null;
  } | null>(null);
  const [assignContextOpened, { open: openAssignContext, close: closeAssignContext }] =
    useDisclosure(false);
  const [assignContextId, setAssignContextId] = useState<string | null>(null);
  const [assignContextLoading, setAssignContextLoading] = useState(false);
  const [moveContextOpened, { open: openMoveContext, close: closeMoveContext }] =
    useDisclosure(false);
  const [moveContextId, setMoveContextId] = useState<string | null>(null);
  const [moveRequestNote, setMoveRequestNote] = useState('');
  const [moveContextLoading, setMoveContextLoading] = useState(false);
  const [moveDecisionLoading, setMoveDecisionLoading] = useState(false);
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [pdfExportJobId, setPdfExportJobId] = useState<string | null>(null);
  const [lastPdfExportStatus, setLastPdfExportStatus] = useState<string | null>(null);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(
    () => document.visibilityState === 'visible'
  );
  const [editTab, setEditTab] = useState<'draft' | 'metadata' | 'access'>('draft');
  const [ackPublishedVersion, setAckPublishedVersion] = useState<number | null>(null);
  const [leadDraftDirty, setLeadDraftDirty] = useState(false);
  const [leadDraftPendingSuggestions, setLeadDraftPendingSuggestions] = useState(0);
  const [leadDraftLastSynced, setLeadDraftLastSynced] = useState<string | null>(null);
  const leadDraftPanelRef = useRef<DocumentLeadDraftPanelHandle>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => fetchDocument(documentId!),
    enabled: !!documentId,
    refetchInterval: false,
  });

  const { data: collaborationHint } = useQuery<DocumentCollaborationHint | null>({
    queryKey: collaborationHintQueryKey(documentId ?? ''),
    queryFn: (): DocumentCollaborationHint | null => null,
    enabled: !!documentId,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const contextOwnerId = data?.contextOwnerId ?? null;

  const { tags, tagOptions, assignContextOptions, moveContextOptions, pdfExportStatus } =
    useDocumentPageSecondaryQueries({
      documentId,
      contextOwnerId,
      documentScope: data?.scope ?? null,
      currentContextId: data?.contextId ?? null,
      isTabVisible,
      assignContextOpened,
      moveContextOpened,
      pdfExportJobId,
    });

  const {
    handleSave,
    handleEditClick,
    handleCancelEdit,
    handlePublish,
    hasUnsavedChanges,
    metadataDirty,
  } = useDocumentPageEditActions({
    documentId,
    data,
    queryClient,
    t,
    searchParams,
    setSearchParams,
    mode,
    setMode,
    setEditTab,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editTagIds,
    setEditTagIds,
    editTypeId,
    setEditTypeId,
    editInitialSnapshot,
    setEditInitialSnapshot,
    setSaveLoading,
    setPublishLoading,
    leadDraftDirty,
    setLeadDraftDirty,
    setAckPublishedVersion,
  });

  const {
    handleAssignContext,
    onCloseMoveContext,
    onCloseAssignContext,
    moveTargetIsCrossOwner,
    handleMoveContext,
    handleMoveRequestDecision,
  } = useDocumentPageContextActions({
    documentId,
    data,
    contextOwnerId,
    queryClient,
    t,
    assignContextId,
    setAssignContextId,
    closeAssignContext,
    setAssignContextLoading,
    moveContextId,
    setMoveContextId,
    closeMoveContext,
    moveRequestNote,
    setMoveRequestNote,
    moveContextOptions,
    setMoveContextLoading,
    setMoveDecisionLoading,
  });

  const { handleDeleteConfirm, handleArchive, handleUnarchive } = useDocumentPageLifecycleActions({
    documentId,
    data,
    queryClient,
    t,
    navigate,
    setDeleteLoading,
    closeDelete,
  });

  useEffect(() => {
    if (data?.currentPublishedVersionNumber == null) return;
    if (mode === 'edit') {
      if (data.canPublish) {
        setAckPublishedVersion(data.currentPublishedVersionNumber);
      } else {
        setAckPublishedVersion((prev) => prev ?? data.currentPublishedVersionNumber);
      }
      return;
    }
    setAckPublishedVersion((prev) => prev ?? data.currentPublishedVersionNumber);
  }, [mode, data?.currentPublishedVersionNumber, data?.canPublish]);

  const latestPublishedVersion = Math.max(
    data?.currentPublishedVersionNumber ?? 0,
    collaborationHint?.publishedVersionNumber ?? 0
  );

  const publishedVersionIsStale =
    !data?.canPublish &&
    ackPublishedVersion != null &&
    latestPublishedVersion > ackPublishedVersion;

  const handleReloadPublishedContent = useCallback(async () => {
    if (!documentId) return;
    const fresh = await queryClient.fetchQuery({
      queryKey: ['document', documentId],
      queryFn: () => fetchDocument(documentId),
    });
    if (fresh.currentPublishedVersionNumber != null) {
      setAckPublishedVersion(fresh.currentPublishedVersionNumber);
    }
    if (documentId) {
      queryClient.removeQueries({ queryKey: collaborationHintQueryKey(documentId) });
    }
  }, [documentId, queryClient]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} – DocsOps`;
    }
    return () => {
      document.title = 'DocsOps – Internal Documentation';
    };
  }, [data?.title]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
      if (visible && documentId && pdfExportJobId) {
        void queryClient.invalidateQueries({
          queryKey: ['document-export-pdf-status', documentId, pdfExportJobId],
        });
      }
      if (visible && documentId) {
        void queryClient.refetchQueries({
          queryKey: ['document', documentId, 'lead-draft'],
          type: 'active',
        });
        void queryClient.invalidateQueries({
          queryKey: ['document', documentId, 'draft-presence'],
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [documentId, pdfExportJobId, queryClient]);

  useEffect(() => {
    if (!data?.id || !recentActions || !data.scope) return;
    const scope =
      data.scope.type === 'personal'
        ? { type: 'personal' as const }
        : data.scope.type === 'company'
          ? { type: 'company' as const, id: data.scope.id }
          : data.scope.type === 'department'
            ? { type: 'department' as const, id: data.scope.id }
            : { type: 'team' as const, id: data.scope.id };
    recentActions.addRecent(
      {
        type: 'document',
        id: data.id,
        name: data.title,
        ...(data.contextName?.trim() ? { contextName: data.contextName.trim() } : {}),
      },
      scope
    );
  }, [data?.id, data?.title, data?.contextName, data?.scope, recentActions]);

  useEffect(() => {
    if (!pdfExportStatus || !documentId) return;
    if (pdfExportStatus.status === lastPdfExportStatus) return;
    setLastPdfExportStatus(pdfExportStatus.status);

    if (pdfExportStatus.status === 'succeeded') {
      void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }

    updatePdfExportStatusNotification(documentId, pdfExportStatus);
  }, [pdfExportStatus, lastPdfExportStatus, queryClient, documentId]);

  const headings = useMemo(() => {
    const fromBlocks = getBlockDocumentHeadingData(data?.publishedBlocks ?? null).headings;
    const title = data?.title?.trim();
    if (!title) return fromBlocks;
    return [{ level: 1, text: title, id: DOCUMENT_TITLE_ANCHOR_ID }, ...fromBlocks];
  }, [data?.publishedBlocks, data?.title]);
  const numberedHeadings = useMemo(() => withHeadingNumbering(headings), [headings]);
  const hasDraftBlocks = (data?.blocks?.blocks?.length ?? 0) > 0;
  const hasPublishedBlocks = (data?.publishedBlocks?.blocks?.length ?? 0) > 0;

  const draftDiffersFromPublished = useMemo(() => {
    if (!data?.blocks || !data.publishedBlocks) return false;
    return JSON.stringify(data.blocks) !== JSON.stringify(data.publishedBlocks);
  }, [data?.blocks, data?.publishedBlocks]);

  const showPublishButton = useMemo(() => {
    if (!data?.canPublish) return false;
    if (leadDraftPendingSuggestions > 0) return false;
    if (!data.publishedAt) return true;
    return !leadDraftDirty && draftDiffersFromPublished;
  }, [
    data?.canPublish,
    data?.publishedAt,
    leadDraftDirty,
    leadDraftPendingSuggestions,
    draftDiffersFromPublished,
  ]);

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || !contextOwnerId) return;
    setCreateTagLoading(true);
    try {
      const res = await apiFetch('/api/v1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ownerId: contextOwnerId }),
      });
      if (res.status === 201) {
        const tag = (await res.json()) as { id: string; name: string };
        void queryClient.invalidateQueries({ queryKey: ['tags', contextOwnerId] });
        setEditTagIds((prev) => [...prev, tag.id]);
        setNewTagName('');
        closeCreateTag();
        notifications.show({
          title: t('documentPage.toasts.tagCreatedTitle'),
          message: tag.name,
          color: 'green',
        });
      } else if (res.status === 409) {
        void notifyApiErrorResponse(res, {
          title: t('documentPage.toasts.tagExistsTitle'),
          defaultMessage: t('documentPage.toasts.tagExistsMessage'),
          color: 'yellow',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setCreateTagLoading(false);
    }
  };

  const handleStartPdfExport = async () => {
    if (!documentId) return;
    setPdfExportLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}/export-pdf`, { method: 'POST' });
      if (!res.ok) {
        if (res.status === 503) {
          void notifyApiErrorResponse(res, {
            title: t('documentPage.toasts.pdfExportDelayedTitle'),
            defaultMessage: t('documentPage.toasts.pdfExportDelayedMessage'),
            color: 'yellow',
          });
          return;
        }
        void notifyApiErrorResponse(res, {
          title: t('documentPage.toasts.pdfExportFailedTitle'),
        });
        return;
      }
      const body = (await res.json()) as { jobId: string; status: string };
      setPdfExportJobId(body.jobId);
      setLastPdfExportStatus(null);
      showPdfExportQueuedNotification(documentId);
    } finally {
      setPdfExportLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const res = await apiFetch(`/api/v1/tags/${tagId}`, { method: 'DELETE' });
    if (res.status === 204) {
      if (contextOwnerId)
        void queryClient.invalidateQueries({ queryKey: ['tags', contextOwnerId] });
      setEditTagIds((prev) => prev.filter((id) => id !== tagId));
      notifications.show({
        title: t('documentPage.toasts.tagDeletedTitle'),
        message: t('documentPage.toasts.tagDeletedMessage'),
        color: 'green',
      });
    }
  };

  useDocumentPageKeyboardEffects({
    mode,
    editTab,
    leadDraftDirty,
    metadataDirty,
    leadDraftPanelRef,
    handleSave,
  });

  return {
    documentId,
    me,
    isPending,
    isError,
    data,
    mode,
    setMode,
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
    leadDraftDirty,
    leadDraftLastSynced,
    setLeadDraftDirty,
    setLeadDraftLastSynced,
    setLeadDraftPendingSuggestions,
    leadDraftPendingSuggestions,
    leadDraftPanelRef,
    headings,
    numberedHeadings,
    hasDraftBlocks,
    hasPublishedBlocks,
    showPublishButton,
    tagOptions,
    tags,
    assignContextOptions,
    moveContextOptions,
    pdfExportStatus,
    pdfExportLoading,
    isTabVisible,
    deleteOpened,
    closeDelete,
    openDelete,
    deleteLoading,
    createTagOpened,
    closeCreateTag,
    openCreateTag,
    manageTagsOpened,
    closeManageTags,
    openManageTags,
    newTagName,
    setNewTagName,
    createTagLoading,
    assignContextOpened,
    openAssignContext,
    assignContextId,
    setAssignContextId,
    assignContextLoading,
    onCloseAssignContext,
    moveContextOpened,
    openMoveContext,
    moveContextId,
    setMoveContextId,
    moveRequestNote,
    setMoveRequestNote,
    moveTargetIsCrossOwner,
    moveContextLoading,
    moveDecisionLoading,
    onCloseMoveContext,
    handleDeleteConfirm,
    handleArchive,
    handleUnarchive,
    handleSave,
    handleEditClick,
    handleCancelEdit,
    handlePublish,
    handleAssignContext,
    handleMoveContext,
    handleMoveRequestDecision,
    handleCreateTag,
    handleStartPdfExport,
    handleDeleteTag,
    hasUnsavedChanges,
    metadataDirty,
    publishedVersionIsStale,
    ackPublishedVersion,
    latestPublishedVersion,
    handleReloadPublishedContent,
  };
}
