import { useCallback, useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import type { SetURLSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import {
  invalidateDocumentIndexCaches,
  invalidateMeDraftsAndPersonalDocuments,
} from './documentQueryInvalidation';
import type { DocumentResponse } from './documentPageTypes';

export type DocumentEditInitialSnapshot = {
  title: string;
  description: string;
  tagIds: string[];
  typeId: string | null;
} | null;

export type UseDocumentPageEditActionsArgs = {
  documentId: string | undefined;
  data: DocumentResponse | undefined;
  queryClient: QueryClient;
  t: TFunction;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  setMode: (mode: 'view' | 'edit') => void;
  setEditTab: (tab: 'draft' | 'metadata' | 'access') => void;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editTagIds: string[];
  setEditTagIds: (v: string[]) => void;
  editTypeId: string | null;
  setEditTypeId: (v: string | null) => void;
  editInitialSnapshot: DocumentEditInitialSnapshot;
  setEditInitialSnapshot: (v: DocumentEditInitialSnapshot) => void;
  setSaveLoading: (v: boolean) => void;
  setPublishLoading: (v: boolean) => void;
  leadDraftDirty: boolean;
  setLeadDraftDirty: (v: boolean) => void;
  setAckPublishedVersion: (v: number | null) => void;
};

function documentTypeKeyToTypeId(key: string | null | undefined): string | null {
  if (key == null || key.length === 0) return null;
  return key.startsWith('custom:') ? key.slice('custom:'.length) : key;
}

/** Save/edit/cancel/publish handlers and the edit-mode URL + dirty-state helpers they rely on. */
export function useDocumentPageEditActions({
  documentId,
  data,
  queryClient,
  t,
  searchParams,
  setSearchParams,
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
}: UseDocumentPageEditActionsArgs) {
  useEffect(() => {
    if (data) {
      setEditTitle(data.title);
      setEditDescription(data.description ?? '');
      setEditTagIds(data.documentTags.map((dt) => dt.tag.id));
      setEditTypeId(documentTypeKeyToTypeId(data.documentTypeKey));
    }
  }, [data, setEditDescription, setEditTagIds, setEditTitle, setEditTypeId]);

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
  }, [documentId, searchParams, setEditTab, setMode]);

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
        title: t('common:toasts.saved'),
        message: t('documentPage.toasts.savedMessage'),
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
    setEditInitialSnapshot,
    setMode,
    setSaveLoading,
    t,
  ]);

  const handleEditClick = () => {
    if (!data) return;
    setEditTab('draft');
    setLeadDraftDirty(false);
    setEditInitialSnapshot({
      title: data.title,
      description: data.description ?? '',
      tagIds: data.documentTags.map((dt) => dt.tag.id),
      typeId: documentTypeKeyToTypeId(data.documentTypeKey),
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
      const ok = window.confirm(t('documentPage.confirmDiscardChanges'));
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
          title: isRepublish
            ? t('documentPage.toasts.publishedChangesTitle')
            : t('documentPage.toasts.publishedTitle'),
          message: isRepublish
            ? t('documentPage.toasts.publishedChangesMessage')
            : t('documentPage.toasts.publishedMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setPublishLoading(false);
    }
  };

  const metadataDirty =
    editInitialSnapshot != null &&
    (editTitle !== editInitialSnapshot.title ||
      editDescription !== editInitialSnapshot.description ||
      editTagIds.join(',') !== editInitialSnapshot.tagIds.join(',') ||
      editTypeId !== editInitialSnapshot.typeId);
  const hasUnsavedChanges = metadataDirty || leadDraftDirty;

  return {
    clearEditUrlParams,
    syncEditUrlParams,
    handleSave,
    handleEditClick,
    handleCancelEdit,
    handlePublish,
    metadataDirty,
    hasUnsavedChanges,
  };
}
