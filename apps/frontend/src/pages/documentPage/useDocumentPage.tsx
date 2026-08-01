/* eslint-disable max-lines -- document page view-model orchestrates load/edit/move/tags */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { scopeToUrl } from '../../lib/scopeNav';
import { useRecentItemsActions } from '../../hooks/useRecentItems';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import { collaborationHintQueryKey } from '../../components/documents/documentLeadDraft/leadDraftQuery.js';
import type { DocumentCollaborationHint } from '../../hooks/useLiveEvents.js';
import {
  invalidateDocumentArchivedTransitionCaches,
  invalidateDocumentIndexCaches,
  invalidateMeDraftsAndPersonalDocuments,
} from './documentQueryInvalidation';
import { getBlockDocumentHeadingData } from './blockDocumentHeadings';
import { withHeadingNumbering } from './documentMarkdown';
import type { DocumentResponse } from './documentPageTypes';
import { useDocumentPageKeyboardEffects } from './useDocumentPageKeyboardEffects';
import { useDocumentPageSecondaryQueries } from './useDocumentPageSecondaryQueries';
import { fetchDocument } from './fetchDocument';
import {
  showPdfExportQueuedNotification,
  updatePdfExportStatusNotification,
} from './pdfExportNotification';

export function useDocumentPage() {
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

  useEffect(() => {
    if (data) {
      setEditTitle(data.title);
      setEditDescription(data.description ?? '');
      setEditTagIds(data.documentTags.map((dt) => dt.tag.id));
      const key = data.documentTypeKey;
      setEditTypeId(
        key == null || key.length === 0
          ? null
          : key.startsWith('custom:')
            ? key.slice('custom:'.length)
            : key
      );
    }
  }, [data]);

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

  const clearEditUrlParams = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('mode');
        next.delete('tab');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const syncEditUrlParams = useCallback(
    (tab: 'draft' | 'metadata' | 'access') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'edit');
          next.set('tab', tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const urlTab = searchParams.get('tab');
    if (urlMode === 'edit') setMode('edit');
    if (urlTab === 'draft' || urlTab === 'metadata' || urlTab === 'access') {
      setEditTab(urlTab);
    }
  }, [documentId, searchParams]);

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

  const headings = useMemo(
    () => getBlockDocumentHeadingData(data?.publishedBlocks ?? null).headings,
    [data?.publishedBlocks]
  );
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

  const handleDeleteConfirm = async () => {
    if (!documentId) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}`, { method: 'DELETE' });
      if (res.status === 204) {
        invalidateDocumentIndexCaches(queryClient, documentId, data?.contextId);
        void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
        closeDelete();
        notifications.show({
          title: 'Moved to trash',
          message: 'Document can be restored from the Trash tab.',
          color: 'green',
        });
        const scope = data?.scope;
        const target = scope != null ? scopeToUrl(scope) : '/catalog';
        void navigate(target, { replace: true });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!documentId) return;
    const res = await apiFetch(`/api/v1/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      invalidateDocumentArchivedTransitionCaches(queryClient, documentId, data?.contextId);
      notifications.show({
        title: 'Archived',
        message: 'Document was archived.',
        color: 'green',
      });
      const scope = data?.scope;
      const target = scope != null ? scopeToUrl(scope) : '/catalog';
      void navigate(target, { replace: true });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleUnarchive = async () => {
    if (!documentId) return;
    const res = await apiFetch(`/api/v1/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: null }),
    });
    if (res.ok) {
      invalidateDocumentArchivedTransitionCaches(queryClient, documentId, data?.contextId);
      notifications.show({
        title: 'Unarchived',
        message: 'Document was restored to active.',
        color: 'green',
      });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleSave = useCallback(async () => {
    if (!documentId || !data) return;
    setSaveLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim() || data.title,
          ...(editDescription.trim()
            ? { description: editDescription.trim() }
            : { description: null }),
          tagIds: editTagIds,
        }),
      });
      if (!res.ok) {
        void notifyApiErrorResponse(res);
        return;
      }

      const initialTypeId = editInitialSnapshot?.typeId ?? null;
      if (editTypeId !== initialTypeId) {
        const typeRes = await apiFetch(`/api/v1/documents/${documentId}/document-type`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ typeId: editTypeId }),
        });
        if (!typeRes.ok) {
          void notifyApiErrorResponse(typeRes);
          return;
        }
      }

      invalidateDocumentIndexCaches(queryClient, documentId, data.contextId);
      setMode('view');
      setEditInitialSnapshot(null);
      clearEditUrlParams();
      notifications.show({
        title: 'Saved',
        message: 'Document metadata updated.',
        color: 'green',
      });
    } finally {
      setSaveLoading(false);
    }
  }, [
    clearEditUrlParams,
    data,
    documentId,
    editDescription,
    editInitialSnapshot?.typeId,
    editTagIds,
    editTitle,
    editTypeId,
    queryClient,
  ]);

  const handleEditClick = () => {
    if (!data) return;
    setEditTab('draft');
    setLeadDraftDirty(false);
    const key = data.documentTypeKey;
    const typeId =
      key == null || key.length === 0
        ? null
        : key.startsWith('custom:')
          ? key.slice('custom:'.length)
          : key;
    setEditInitialSnapshot({
      title: data.title,
      description: data.description ?? '',
      tagIds: data.documentTags.map((dt) => dt.tag.id),
      typeId,
    });
    setMode('edit');
    syncEditUrlParams('draft');
  };

  const handleCancelEdit = () => {
    const dirtyMetadata =
      editInitialSnapshot != null &&
      (editTitle !== editInitialSnapshot.title ||
        editDescription !== editInitialSnapshot.description ||
        editTagIds.join(',') !== editInitialSnapshot.tagIds.join(',') ||
        editTypeId !== editInitialSnapshot.typeId);
    const dirty = dirtyMetadata || leadDraftDirty;
    if (dirty) {
      const ok = window.confirm('Unsaved progress may be lost. Cancel editing anyway?');
      if (!ok) return;
    }
    setMode('view');
    setEditInitialSnapshot(null);
    setLeadDraftDirty(false);
    clearEditUrlParams();
  };

  const handlePublish = async () => {
    if (!documentId) return;
    setPublishLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        const published = (await res.json()) as DocumentResponse;
        queryClient.setQueryData(['document', documentId], published);
        const publishedVersion = published.currentPublishedVersionNumber;
        if (publishedVersion != null) {
          setAckPublishedVersion(publishedVersion);
        }
        invalidateDocumentIndexCaches(queryClient, documentId, data?.contextId);
        invalidateMeDraftsAndPersonalDocuments(queryClient);
        void queryClient.invalidateQueries({ queryKey: ['document', documentId, 'lead-draft'] });
        setMode('view');
        setEditInitialSnapshot(null);
        setLeadDraftDirty(false);
        clearEditUrlParams();
        const isRepublish = Boolean(data?.publishedAt);
        notifications.show({
          title: isRepublish ? 'Published changes' : 'Published',
          message: isRepublish ? 'A new published version was created.' : 'Document was published.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAssignContext = async () => {
    if (!documentId || !assignContextId) return;
    setAssignContextLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextId: assignContextId }),
      });
      if (res.ok) {
        closeAssignContext();
        if (data?.contextId)
          void queryClient.invalidateQueries({
            queryKey: ['contexts', data.contextId, 'documents'],
          });
        if (assignContextId)
          void queryClient.invalidateQueries({
            queryKey: ['contexts', assignContextId, 'documents'],
          });
        setAssignContextId(null);
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
        notifications.show({
          title: 'Context assigned',
          message: 'You can now publish the draft.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setAssignContextLoading(false);
    }
  };

  const onCloseMoveContext = () => {
    closeMoveContext();
    setMoveContextId(null);
    setMoveRequestNote('');
  };

  const selectedMoveOption = moveContextOptions.find((o) => o.value === moveContextId);
  const moveTargetIsCrossOwner =
    selectedMoveOption != null &&
    contextOwnerId != null &&
    selectedMoveOption.ownerId != null &&
    selectedMoveOption.ownerId !== contextOwnerId;

  const handleMoveContext = async () => {
    if (!documentId || !moveContextId) return;
    setMoveContextLoading(true);
    try {
      const fromContextId = data?.contextId ?? null;
      const isRequest = moveTargetIsCrossOwner;
      const res = await apiFetch(
        isRequest
          ? `/api/v1/documents/${documentId}/move-requests`
          : `/api/v1/documents/${documentId}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isRequest
              ? {
                  targetContextId: moveContextId,
                  note: moveRequestNote.trim() ? moveRequestNote.trim() : null,
                }
              : { targetContextId: moveContextId }
          ),
        }
      );
      if (res.ok) {
        onCloseMoveContext();
        if (!isRequest && fromContextId) {
          void queryClient.invalidateQueries({
            queryKey: ['contexts', fromContextId, 'documents'],
          });
          void queryClient.invalidateQueries({
            queryKey: ['contexts', moveContextId, 'documents'],
          });
        }
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'move-requests'] });
        notifications.show({
          title: isRequest ? 'Move requested' : 'Document moved',
          message: isRequest
            ? 'The target lead can accept or reject the request under Approvals.'
            : 'The document is now in the selected context.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setMoveContextLoading(false);
    }
  };

  const handleMoveRequestDecision = async (action: 'accept' | 'reject' | 'withdraw') => {
    const pending = data?.pendingMoveRequest;
    if (!documentId || !pending) return;
    setMoveDecisionLoading(true);
    try {
      const res = await apiFetch(
        `/api/v1/documents/${documentId}/move-requests/${pending.id}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'move-requests'] });
        notifications.show({
          title:
            action === 'accept'
              ? 'Move accepted'
              : action === 'reject'
                ? 'Move rejected'
                : 'Move request withdrawn',
          message:
            action === 'accept'
              ? 'The document is now in the target context.'
              : action === 'reject'
                ? 'The document stays in its current context.'
                : 'The target lead was notified.',
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setMoveDecisionLoading(false);
    }
  };

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
          title: 'Tag created',
          message: tag.name,
          color: 'green',
        });
      } else if (res.status === 409) {
        void notifyApiErrorResponse(res, {
          title: 'Tag exists',
          defaultMessage: 'A tag with this name already exists.',
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
            title: 'PDF export currently delayed',
            defaultMessage: 'Queue/worker is currently unavailable. Please try again shortly.',
            color: 'yellow',
          });
          return;
        }
        void notifyApiErrorResponse(res, {
          title: 'PDF export could not be started',
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
      notifications.show({ title: 'Tag deleted', message: 'Tag was removed.', color: 'green' });
    }
  };

  useDocumentPageKeyboardEffects({
    mode,
    editTab,
    leadDraftDirty,
    leadDraftPanelRef,
    handleSave,
  });

  const metadataDirty =
    editInitialSnapshot != null &&
    (editTitle !== editInitialSnapshot.title ||
      editDescription !== editInitialSnapshot.description ||
      editTagIds.join(',') !== editInitialSnapshot.tagIds.join(',') ||
      editTypeId !== editInitialSnapshot.typeId);
  const hasUnsavedChanges = metadataDirty || leadDraftDirty;

  const onCloseAssignContext = () => {
    closeAssignContext();
    setAssignContextId(null);
  };

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
    publishedVersionIsStale,
    ackPublishedVersion,
    latestPublishedVersion,
    handleReloadPublishedContent,
  };
}
